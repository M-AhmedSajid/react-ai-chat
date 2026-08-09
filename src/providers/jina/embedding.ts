import { EmbeddingProvider, JinaEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { JinaClient } from "./client.ts";

export function jinaEmbedding(
  client: JinaClient,
  options: JinaEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "jina-embeddings-v3";

  return {
    name: "jina",
    model,

    async embed(text: string, type = "document") {
      try {
        const response = await client.embeddings.create({
          model,
          input: [text],
          task: type === "query" ? "retrieval.query" : "retrieval.passage",
        });

        const embedding = response.data?.[0]?.embedding;

        if (!embedding) {
          throw new ChatbotError("Jina failed to return embedding values.");
        }

        return embedding;
      } catch (error) {
        if (error instanceof ChatbotError) {
          throw error;
        }

        throw new ChatbotError(`Jina embedding error: ${error}`);
      }
    },
  };
}
