import type { EmbeddingProvider, CohereEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface CohereClient {
  embed(args: {
    model: string;
    inputType: "search_document" | "search_query";
    texts: string[];
    outputDimension?: number;
  }): Promise<{
    embeddings?: {
      float?: number[][];
    };
  }>;
}

export function cohereEmbedding(
  client: CohereClient,
  options: CohereEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "embed-v4.0";

  return {
    name: "cohere",
    model,

    async embed(text: string, type = "document") {
      try {
        const response = await client.embed({
          model,
          inputType: type === "query" ? "search_query" : "search_document",
          texts: [text],
          outputDimension: options.dimensions,
        });

        const embedding = response.embeddings?.float?.[0];

        if (!embedding) {
          throw new ChatbotError("Cohere failed to return embedding values.");
        }

        return embedding;
      } catch (error) {
        throwProviderError("Cohere", error);
      }
    },
  };
}
