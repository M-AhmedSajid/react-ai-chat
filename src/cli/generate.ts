import fs from "fs/promises";
import path from "path";
import {
  Chunk,
  EmbeddedChunk,
  EmbeddingIndex,
  EmbeddingProvider,
  EmbeddingRateLimit,
} from "../types.ts";
import { ChatbotError } from "../error.ts";
import { EmbeddingRateLimiter } from "./embedding-rate-limiter.ts";
import { createHash } from "node:crypto";

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30_000;
const EMBEDDING_PROGRESS_PATH = "./chatbot/embedding.progress.json";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getEmbeddingProgressPath(): string {
  return EMBEDDING_PROGRESS_PATH;
}

function hashChunk(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

interface EmbeddingProgressChunk {
  id: string;
  hash: string;
  embedding: number[];
}

interface EmbeddingProgress {
  provider: string;
  model: string;
  dimensions: number;
  chunks: EmbeddingProgressChunk[];
}

function validateEmbeddingProgress(progress: EmbeddingProgress): void {
  if (
    typeof progress.provider !== "string" ||
    typeof progress.model !== "string" ||
    typeof progress.dimensions !== "number" ||
    !Array.isArray(progress.chunks)
  ) {
    throw new ChatbotError(
      "The embedding progress file is invalid or corrupted.",
      "INVALID_REQUEST",
    );
  }

  for (const chunk of progress.chunks) {
    if (
      typeof chunk.id !== "string" ||
      typeof chunk.hash !== "string" ||
      !Array.isArray(chunk.embedding) ||
      chunk.embedding.some((value) => typeof value !== "number")
    ) {
      throw new ChatbotError(
        "The embedding progress file contains invalid chunk data.",
        "INVALID_REQUEST",
      );
    }
  }
}

export async function loadEmbeddingProgress(
  progressPath: string,
): Promise<EmbeddingProgress | null> {
  const absolutePath = path.resolve(progressPath);

  try {
    const file = await fs.readFile(absolutePath, "utf-8");

    return JSON.parse(file) as EmbeddingProgress;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function saveEmbeddingProgress(
  progressPath: string,
  progress: EmbeddingProgress,
): Promise<void> {
  const absolutePath = path.resolve(progressPath);

  await fs.mkdir(path.dirname(absolutePath), {
    recursive: true,
  });

  await fs.writeFile(absolutePath, JSON.stringify(progress, null, 2), "utf-8");
}

export async function deleteEmbeddingProgress(
  progressPath: string,
): Promise<void> {
  const absolutePath = path.resolve(progressPath);

  try {
    await fs.unlink(absolutePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function generateEmbeddings(
  chunks: Chunk[],
  provider: EmbeddingProvider,
  options?: {
    embeddingBatchSize?: number;
    embeddingRateLimit?: EmbeddingRateLimit;
    progressPath?: string;
  },
): Promise<EmbeddingIndex> {
  const progressPath = options?.progressPath;

  let progress: EmbeddingProgress | null = null;

  if (progressPath) {
    progress = await loadEmbeddingProgress(progressPath);

    if (progress) {
      validateEmbeddingProgress(progress);
      if (progress.provider !== provider.name) {
        throw new ChatbotError(
          `Embedding progress was created with provider "${progress.provider}", ` +
            `but the current provider is "${provider.name}".`,
          "INVALID_REQUEST",
        );
      }

      if (progress.model !== provider.model) {
        throw new ChatbotError(
          `Embedding progress was created with model "${progress.model}", ` +
            `but the current model is "${provider.model}".`,
          "INVALID_REQUEST",
        );
      }
    }
  }

  if (
    options?.embeddingBatchSize !== undefined &&
    (!Number.isInteger(options.embeddingBatchSize) ||
      options.embeddingBatchSize <= 0)
  ) {
    throw new ChatbotError(
      "Embedding batch size must be a positive whole number.",
      "INVALID_REQUEST",
    );
  }

  if (!Number.isInteger(provider.maxBatchSize) || provider.maxBatchSize <= 0) {
    throw new ChatbotError(
      `Embedding provider "${provider.name}" has an invalid maxBatchSize.`,
      "INVALID_REQUEST",
    );
  }

  const maxBatchSize = provider.maxBatchSize;

  const requestedBatchSize = options?.embeddingBatchSize ?? maxBatchSize;

  const batchSize = Math.min(requestedBatchSize, maxBatchSize);

  const maxBatchTokens = provider.maxBatchTokens;

  const progressById = new Map(
    progress?.chunks.map((chunk) => [chunk.id, chunk]) ?? [],
  );

  const currentChunkIds = new Set(chunks.map((chunk) => chunk.id));

  const pendingChunks = chunks.filter((chunk) => {
    const saved = progressById.get(chunk.id);

    return !saved || saved.hash !== hashChunk(chunk.text);
  });

  const buildEmbeddingBatch = (startIndex: number): Chunk[] => {
    /*
     * Without a documented token limit and exact token counter,
     * use the provider's batch-size limit.
     */
    if (!maxBatchTokens || !provider.countTokens) {
      return pendingChunks.slice(startIndex, startIndex + batchSize);
    }

    const batch: Chunk[] = [];
    let totalTokens = 0;

    for (
      let i = startIndex;
      i < pendingChunks.length && batch.length < batchSize;
      i++
    ) {
      const chunk = pendingChunks[i];

      if (!chunk) {
        break;
      }

      const tokens = provider.countTokens(chunk.text);

      if (tokens > maxBatchTokens) {
        throw new ChatbotError(
          `Chunk "${chunk.id}" contains ${tokens} tokens, ` +
            `which exceeds the maximum batch token limit ` +
            `of ${maxBatchTokens} for ${provider.model}.`,
          "INVALID_REQUEST",
        );
      }

      if (batch.length > 0 && totalTokens + tokens > maxBatchTokens) {
        break;
      }

      batch.push(chunk);
      totalTokens += tokens;
    }

    return batch;
  };

  const embedBatch = async (batch: Chunk[]): Promise<number[][]> => {
    if (provider.embedMany) {
      return provider.embedMany(batch.map((chunk) => chunk.text));
    }

    const embeddings: number[][] = [];

    for (const chunk of batch) {
      embeddings.push(await provider.embed(chunk.text));
    }

    return embeddings;
  };

  const rateLimiter = new EmbeddingRateLimiter(options?.embeddingRateLimit);

  const result: EmbeddedChunk[] = [];
  let dimensions: number | undefined = progress?.dimensions;

  for (const chunk of chunks) {
    const saved = progressById.get(chunk.id);

    if (!saved || saved.hash !== hashChunk(chunk.text)) {
      continue;
    }

    result.push({
      id: chunk.id,
      source: chunk.source,
      chunk: chunk.chunk,
      text: chunk.text,
      embedding: saved.embedding,
      embeddingModel: provider.model,
    });
  }

  if (!progress) {
    progress = {
      provider: provider.name,
      model: provider.model,
      dimensions: 0,
      chunks: [],
    };
  }

  progress.chunks = progress.chunks.filter((chunk) =>
    currentChunkIds.has(chunk.id),
  );

  if (options?.progressPath) {
    await saveEmbeddingProgress(options.progressPath, progress);
  }

  let processed = 0;
  let batchNumber = 0;

  while (processed < pendingChunks.length) {
    const batch = buildEmbeddingBatch(processed);

    if (batch.length === 0) {
      throw new ChatbotError(
        `Unable to create an embedding batch for ${provider.name}.`,
        "INVALID_REQUEST",
      );
    }

    batchNumber++;

    const tokenCount = provider.countTokens
      ? batch.reduce(
          (total, chunk) => total + provider.countTokens!(chunk.text),
          0,
        )
      : 0;

    const batchStartIndex = chunks.findIndex(
      (chunk) => chunk.id === batch[0]?.id,
    );

    const batchEndIndex = chunks.findIndex(
      (chunk) => chunk.id === batch[batch.length - 1]?.id,
    );

    const startChunk = batchStartIndex + 1;
    const endChunk = batchEndIndex + 1;

    console.log(
      `Embedding batch ${batchNumber}: chunks ${
        startChunk
      }-${endChunk}/${chunks.length} ` +
        `via ${provider.name} (${provider.model})` +
        `${tokenCount > 0 ? ` [${tokenCount} tokens]` : ""}`,
    );

    let vectors: number[][] | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await rateLimiter.wait(tokenCount);

        vectors = await embedBatch(batch);

        break;
      } catch (error) {
        if (!(error instanceof ChatbotError && error.code === "RATE_LIMIT")) {
          throw error;
        }

        if (attempt >= MAX_RETRIES) {
          break;
        }

        const delay = Math.min(
          INITIAL_RETRY_DELAY * 2 ** attempt,
          MAX_RETRY_DELAY,
        );

        console.warn(
          `Rate limit reached for ${provider.model}. ` +
            `Retrying in ${delay / 1000}s ` +
            `(attempt ${attempt + 1}/${MAX_RETRIES})...`,
        );

        await sleep(delay);
      }
    }

    if (!vectors) {
      const generated = result.length + processed;
      const remaining = chunks.length - generated;

      throw new ChatbotError(
        `Embedding generation stopped because the provider quota or rate limit was reached.\n\n` +
          `Progress saved:\n` +
          `  Generated: ${generated} / ${chunks.length}\n` +
          `  Remaining: ${remaining}\n\n` +
          `Provider:\n` +
          `  Provider: ${provider.name}\n` +
          `  Model: ${provider.model}\n\n` +
          `Run "npx react-ai-chat embed" again to continue from where it stopped.\n\n` +
          `Possible solutions:\n` +
          `  • Wait for the provider quota or rate limit to reset\n` +
          `  • Configure an appropriate client-side rate limit\n` +
          `  • Use a project or account with higher quota\n` +
          `  • Try again later`,
        "RATE_LIMIT",
      );
    }

    console.log(`✓ Batch ${batchNumber} completed`);

    if (vectors.length !== batch.length) {
      throw new ChatbotError(
        `${provider.name} returned ${vectors.length} embeddings ` +
          `for ${batch.length} chunks.`,
        "PROVIDER",
      );
    }

    for (let i = 0; i < batch.length; i++) {
      const chunk = batch[i];
      const vector = vectors[i];

      if (!vector) {
        throw new ChatbotError(
          `${provider.name} returned an empty embedding ` +
            `for chunk "${chunk.id}".`,
          "PROVIDER",
        );
      }

      if (dimensions === undefined) {
        dimensions = vector.length;
      } else if (vector.length !== dimensions) {
        throw new ChatbotError(
          `Embedding model "${provider.model}" returned ` +
            `${vector.length} dimensions, but the index expects ` +
            `${dimensions}.`,
          "INVALID_REQUEST",
        );
      }

      const embeddedChunk: EmbeddedChunk = {
        id: chunk.id,
        source: chunk.source,
        chunk: chunk.chunk,
        text: chunk.text,
        embedding: vector,
        embeddingModel: provider.model,
      };

      result.push(embeddedChunk);

      progress!.chunks = progress!.chunks.filter(
        (savedChunk) => savedChunk.id !== chunk.id,
      );

      progress!.chunks.push({
        id: chunk.id,
        hash: hashChunk(chunk.text),
        embedding: vector,
      });
    }

    progress!.dimensions = dimensions ?? 0;

    if (options?.progressPath) {
      await saveEmbeddingProgress(options.progressPath, progress!);
    }

    processed += batch.length;
  }

  if (options?.progressPath) {
    await deleteEmbeddingProgress(options.progressPath);
  }

  return {
    provider: provider.name,
    model: provider.model,
    dimensions: dimensions ?? 0,
    chunks: result,
  };
}

export async function saveIndex(
  outputPath: string,
  index: EmbeddingIndex,
): Promise<void> {
  const absolutePath = path.resolve(outputPath);

  await fs.mkdir(path.dirname(absolutePath), {
    recursive: true,
  });

  await fs.writeFile(absolutePath, JSON.stringify(index, null, 2), "utf-8");

  console.log(`Saved index to ${absolutePath}`);
}
