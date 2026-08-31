import type { EmbeddingProvider, VoyageEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface VoyageClient {
  embed(args: {
    input: string[];
    model: string;
    inputType?: "query" | "document";
    outputDimension?: number;
  }): Promise<{
    data?: Array<{
      embedding?: number[];
    }>;
  }>;
}

const MAX_BATCH_SIZE = 1000;

export function voyageEmbedding(
  client: VoyageClient,
  options: VoyageEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "voyage-3.5-lite";

  async function embedMany(
    texts: string[],
    type: "document" | "query" = "document",
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await client.embed({
        input: texts,
        model,
        inputType: type,
        ...(options.dimensions !== undefined
          ? { outputDimension: options.dimensions }
          : {}),
      });

      const embeddings = response.data?.map((item) => item.embedding);

      if (
        !embeddings ||
        embeddings.length !== texts.length ||
        embeddings.some((embedding) => !embedding)
      ) {
        throw new ChatbotError(
          `Voyage returned ${embeddings?.length ?? 0} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings as number[][];
    } catch (error) {
      throwProviderError("Voyage", error);
    }
  }

  return {
    name: "voyage",
    model,
    maxBatchSize: MAX_BATCH_SIZE,

    async embed(text: string, type = "document") {
      const embeddings = await embedMany([text], type);
      return embeddings[0];
    },

    embedMany,
  };
}
