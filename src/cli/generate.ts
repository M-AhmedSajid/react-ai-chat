import fs from "fs/promises";
import path from "path";
import {
  Chunk,
  EmbeddedChunk,
  EmbeddingIndex,
  EmbeddingProvider,
} from "../types.ts";

export async function generateEmbeddings(
  chunks: Chunk[],
  provider: EmbeddingProvider,
): Promise<EmbeddingIndex> {
  const result: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(
      `Embedding ${i + 1}/${chunks.length} (${chunk.id}) via ${provider.name}`,
    );

    const vector = await provider.embed(chunk.text);

    result.push({
      id: chunk.id,
      source: chunk.source,
      chunk: chunk.chunk,
      text: chunk.text,
      embedding: vector,
    });
  }

  return {
    provider: provider.name,
    model: provider.model,
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
