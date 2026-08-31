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

const MAX_BATCH_SIZE = 96;

export function cohereEmbedding(
  client: CohereClient,
  options: CohereEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "embed-v4.0";

  async function embedMany(
    texts: string[],
    type: "document" | "query" = "document",
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await client.embed({
        model,
        inputType: type === "query" ? "search_query" : "search_document",
        texts,
        ...(options.dimensions !== undefined
          ? { outputDimension: options.dimensions }
          : {}),
      });

      const embeddings = response.embeddings?.float;

      if (
        !embeddings ||
        embeddings.length !== texts.length ||
        embeddings.some((embedding) => !embedding)
      ) {
        throw new ChatbotError(
          `Cohere returned ${embeddings?.length ?? 0} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings;
    } catch (error) {
      throwProviderError("Cohere", error);
    }
  }

  return {
    name: "cohere",
    model,
    maxBatchSize: MAX_BATCH_SIZE,

    async embed(text: string, type = "document") {
      const embeddings = await embedMany([text], type);
      return embeddings[0];
    },

    embedMany,
  };
}
