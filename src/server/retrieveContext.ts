import { ChatbotError } from "../error.ts";
import { EmbeddedChunk, RetrieveContextOptions } from "../types.ts";
import { cosineSimilarity } from "./cosineSimilarity.ts";

export interface RankedChunk extends EmbeddedChunk {
  score: number;
}

export async function retrieveContext({
  question,
  embeddings,
  embedFn,
  topK = 3,
}: RetrieveContextOptions): Promise<RankedChunk[]> {
  // 1. Missing or invalid embeddings array check
  if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
    throw new ChatbotError(
      "Missing or invalid embeddings index. Ensure embeddings.json is loaded and non-empty.",
    );
  }

  // 2. Validate structural integrity of first chunk (detect corrupt JSON structure)
  const sampleChunk = embeddings[0];
  if (!sampleChunk || !Array.isArray(sampleChunk.embedding)) {
    throw new ChatbotError(
      "Corrupt embeddings JSON. File does not match expected EmbeddedChunk[] schema.",
    );
  }

  // 3. Generate query vector
  let queryVector: number[];
  try {
    queryVector = await embedFn(question);
  } catch (err: any) {
    throw new ChatbotError(
      `Failed to generate query embedding: ${err.message || err}`,
    );
  }

  // 4. Verify vector dimension compatibility
  const expectedDim = sampleChunk.embedding.length;
  if (queryVector.length !== expectedDim) {
    throw new ChatbotError(
      `Embedding dimension mismatch. Index was built with ${expectedDim}-dim vectors, but query provider returned ${queryVector.length}-dim vectors.`,
    );
  }

  const ranked: RankedChunk[] = embeddings
    .map((item) => ({
      ...item,
      score: cosineSimilarity(queryVector, item.embedding), // Pure semantic score
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, topK);
}

/**
 * Formats top chunks into a single structured context block with clear source tags.
 */
export function formatContext(chunks: RankedChunk[]): string {
  if (chunks.length === 0) return "";

  return chunks
    .map(
      (chunk) =>
        `Source: ${chunk.source} (Chunk ${chunk.chunk})\n${chunk.text}`,
    )
    .join("\n\n----------------\n\n");
}
