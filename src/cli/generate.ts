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

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateEmbeddings(
  chunks: Chunk[],
  provider: EmbeddingProvider,
  options?: {
    embeddingBatchSize?: number;
    embeddingRateLimit?: EmbeddingRateLimit;
  },
): Promise<EmbeddingIndex> {
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

  const buildEmbeddingBatch = (startIndex: number): Chunk[] => {
    /*
     * Without a documented token limit and exact token counter,
     * use the provider's batch-size limit.
     */
    if (!maxBatchTokens || !provider.countTokens) {
      return chunks.slice(startIndex, startIndex + batchSize);
    }

    const batch: Chunk[] = [];
    let totalTokens = 0;

    for (
      let i = startIndex;
      i < chunks.length && batch.length < batchSize;
      i++
    ) {
      const chunk = chunks[i];

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
  let dimensions: number | undefined;
  let processed = 0;
  let batchNumber = 0;

  while (processed < chunks.length) {
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

    console.log(
      `Embedding batch ${batchNumber}: chunks ${
        processed + 1
      }-${processed + batch.length}/${chunks.length} ` +
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
      throw new ChatbotError(
        `Embedding generation failed.\n\n` +
          `Provider quota or rate limit reached:\n` +
          `  Provider: ${provider.name}\n` +
          `  Model: ${provider.model}\n\n` +
          `The provider continued to reject embedding requests ` +
          `after ${MAX_RETRIES} retries with exponential backoff.\n\n` +
          `The current embedding run was not completed, and no new ` +
          `embedding index was saved.\n\n` +
          `Possible solutions:\n` +
          `  • Wait for the provider quota or rate limit to reset\n` +
          `  • Reduce the amount of content being embedded\n` +
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

      result.push({
        id: chunk.id,
        source: chunk.source,
        chunk: chunk.chunk,
        text: chunk.text,
        embedding: vector,
        embeddingModel: provider.model,
      });
    }

    processed += batch.length;
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
