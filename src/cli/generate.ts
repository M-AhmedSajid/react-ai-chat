import fs from "fs/promises";
import path from "path";
import {
  Chunk,
  EmbeddedChunk,
  EmbeddingIndex,
  EmbeddingProvider,
} from "../types.ts";
import { ChatbotError } from "../error.ts";

export async function generateEmbeddings(
  chunks: Chunk[],
  primaryProvider: EmbeddingProvider,
  fallbackProvider?: EmbeddingProvider,
): Promise<EmbeddingIndex> {
  const result: EmbeddedChunk[] = [];

  const primaryModel = primaryProvider.model;
  let activeProvider = primaryProvider;
  let dimensions: number | undefined;

  const getBatchSize = (provider: EmbeddingProvider): number => {
    if (
      !Number.isInteger(provider.maxBatchSize) ||
      provider.maxBatchSize <= 0
    ) {
      throw new ChatbotError(
        `Embedding provider "${provider.name}" has an invalid maxBatchSize.`,
        "INVALID_REQUEST",
      );
    }

    return provider.maxBatchSize;
  };

  const embedBatch = async (
    provider: EmbeddingProvider,
    batch: Chunk[],
  ): Promise<number[][]> => {
    if (provider.embedMany) {
      return provider.embedMany(batch.map((chunk) => chunk.text));
    }

    const embeddings: number[][] = [];

    for (const chunk of batch) {
      embeddings.push(await provider.embed(chunk.text));
    }

    return embeddings;
  };

  let processed = 0;

  while (processed < chunks.length) {
    const batchSize = getBatchSize(activeProvider);
    const batch = chunks.slice(processed, processed + batchSize);

    const totalBatches = Math.ceil(chunks.length / batchSize);
    const currentBatch = Math.floor(processed / batchSize) + 1;

    console.log(
      `Embedding batch ${currentBatch}/${totalBatches}: chunks ${processed + 1}-${processed + batch.length}/${chunks.length} via ${activeProvider.name} (${activeProvider.model})`,
    );

    let vectors: number[][];

    try {
      vectors = await embedBatch(activeProvider, batch);
    } catch (error) {
      if (
        activeProvider === primaryProvider &&
        fallbackProvider &&
        error instanceof ChatbotError &&
        error.code === "RATE_LIMIT"
      ) {
        console.warn(
          `\nPrimary model "${primaryProvider.model}" reached its limit.`,
        );

        console.warn(
          `Switching to fallback model "${fallbackProvider.model}".\n`,
        );

        activeProvider = fallbackProvider;

        vectors = await embedBatch(activeProvider, batch);
      } else {
        throw error;
      }
    }

    console.log(`✓ Batch ${currentBatch}/${totalBatches} completed`);

    if (vectors.length !== batch.length) {
      throw new ChatbotError(
        `${activeProvider.name} returned ${vectors.length} embeddings for ${batch.length} chunks.`,
        "PROVIDER",
      );
    }

    for (let i = 0; i < batch.length; i++) {
      const chunk = batch[i];
      const vector = vectors[i];

      if (!vector) {
        throw new ChatbotError(
          `${activeProvider.name} returned an empty embedding for chunk "${chunk.id}".`,
          "PROVIDER",
        );
      }

      if (dimensions === undefined) {
        dimensions = vector.length;
      } else if (vector.length !== dimensions) {
        throw new ChatbotError(
          `Embedding model "${activeProvider.model}" returned ${vector.length} dimensions, but the index expects ${dimensions}.`,
          "INVALID_REQUEST",
        );
      }

      result.push({
        id: chunk.id,
        source: chunk.source,
        chunk: chunk.chunk,
        text: chunk.text,
        embedding: vector,
        embeddingModel: activeProvider.model,
      });
    }

    processed += batch.length;
  }

  return {
    provider: primaryProvider.name,
    model: primaryModel,
    fallbackModel: fallbackProvider?.model,
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
