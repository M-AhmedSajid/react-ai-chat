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

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(
      `Embedding ${i + 1}/${chunks.length} (${chunk.id}) via ${activeProvider.name} (${activeProvider.model})`,
    );

    let vector: number[];

    try {
      vector = await activeProvider.embed(chunk.text);
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

        vector = await activeProvider.embed(chunk.text);
      } else {
        throw error;
      }
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

  return {
    provider: primaryProvider.name,
    model: primaryProvider.model,
    fallbackModel: fallbackProvider?.model,
    dimensions: result[0]?.embedding.length ?? 0,
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
