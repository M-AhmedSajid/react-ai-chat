import type { EmbeddingProvider, JinaEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { JinaClient } from "./client.ts";
import { throwProviderError } from "../utils.ts";

const MAX_BATCH_SIZE = 2048;

export function jinaEmbedding(
  client: JinaClient,
  options: JinaEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "jina-embeddings-v3";

  async function embedMany(
    texts: string[],
    type: "document" | "query" = "document",
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await client.embeddings.create({
        model,
        input: texts,
        task: type === "query" ? "retrieval.query" : "retrieval.passage",
        dimensions: options.dimensions,
      });

      const embeddings = response.data?.map((item) => item.embedding);

      if (
        !embeddings ||
        embeddings.length !== texts.length ||
        embeddings.some((embedding) => !embedding)
      ) {
        throw new ChatbotError(
          `Jina returned ${embeddings?.length ?? 0} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings as number[][];
    } catch (error) {
      throwProviderError("Jina", error);
    }
  }

  return {
    name: "jina",
    model,
    maxBatchSize: MAX_BATCH_SIZE,

    async embed(text: string, type = "document") {
      const embeddings = await embedMany([text], type);
      return embeddings[0];
    },

    embedMany,
  };
}
