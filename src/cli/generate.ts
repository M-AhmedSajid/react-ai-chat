import fs from "fs/promises";
import path from "path";
import { Chunk, EmbeddedChunk, EmbeddingProvider } from "../types.ts";

export async function generateEmbeddings(
  chunks: Chunk[],
  provider: EmbeddingProvider,
): Promise<EmbeddedChunk[]> {
  const result: EmbeddedChunk[] = [];
  const total = chunks.length;

  for (let i = 0; i < total; i++) {
    const chunk = chunks[i];
    console.log(
      `Embedding ${i + 1}/${total} (${chunk.id}) via ${provider.name}`,
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

  return result;
}

export async function saveIndex(
  outputPath: string,
  embeddings: EmbeddedChunk[],
): Promise<void> {
  const absolutePath = path.resolve(outputPath);

  const dir = path.dirname(absolutePath);
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(
    absolutePath,
    JSON.stringify(embeddings, null, 2),
    "utf-8",
  );
  console.log(`Saved index to ${absolutePath}`);
}
