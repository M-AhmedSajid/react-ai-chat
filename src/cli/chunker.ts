import { Chunk, Document } from "../types.ts";

export function chunkDocuments(
  documents: Document[],
  chunkSize = 1000,
  overlap = 200,
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const document of documents) {
    let index = 0;
    let chunkNumber = 1;

    while (index < document.text.length) {
      const text = document.text.slice(index, index + chunkSize);

      chunks.push({
        id: `${document.id}#${chunkNumber}`,
        source: document.id,
        chunk: chunkNumber,
        text,
      });

      index += chunkSize - overlap;
      chunkNumber++;
    }
  }

  return chunks;
}
