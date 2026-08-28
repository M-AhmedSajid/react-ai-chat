import { ChatbotError } from "../error.ts";
import { EmbeddingIndex, EmbeddingProvider, EmbeddedChunk } from "../types.ts";
import { cosineSimilarity } from "./cosineSimilarity.ts";

export interface RankedChunk extends EmbeddedChunk {
  score: number;
}

export interface RetrieveContextOptions {
  question: string;
  index: EmbeddingIndex;
  provider: EmbeddingProvider;
  topK?: number;
}

export async function retrieveContext({
  question,
  index,
  provider,
  topK = 3,
}: RetrieveContextOptions): Promise<RankedChunk[]> {
  const { chunks, provider: indexProvider, model, dimensions } = index;

  // 1. Validate embeddings index
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    throw new ChatbotError(
      "Missing or invalid embeddings index. Ensure embeddings.json is loaded and non-empty.",
    );
  }

  // 2. Validate chunk structure
  const sampleChunk = chunks[0];

  if (!sampleChunk || !Array.isArray(sampleChunk.embedding)) {
    throw new ChatbotError(
      "Corrupt embeddings JSON. File does not match expected EmbeddedChunk[] schema.",
    );
  }

  // 3. Validate provider compatibility
  if (indexProvider !== provider.name || model !== provider.model) {
    throw new ChatbotError(
      `Embedding provider mismatch. Index was created using ${indexProvider}/${model}, but current provider is ${provider.name}/${provider.model}. Please use the same embedding provider and model or regenerate your embeddings.`,
    );
  }

  // 4. Generate query embedding
  let queryVector: number[];

  try {
    queryVector = await provider.embed(question);
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }

    throw new ChatbotError(
      `Failed to generate query embedding: ${error}`,
      "PROVIDER",
    );
  }

  // 5. Verify dimensions
  const expectedDimensions = dimensions ?? sampleChunk.embedding.length;

  if (queryVector.length !== expectedDimensions) {
    throw new ChatbotError(
      `Embedding dimension mismatch. Index was built with ${expectedDimensions}-dimensional vectors, but query provider returned ${queryVector.length}-dimensional vectors.`,
    );
  }

  // 6. Calculate similarity scores
  const ranked: RankedChunk[] = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, topK);
}

/**
 * Formats retrieved chunks into a context block for the LLM.
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
