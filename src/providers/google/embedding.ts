import type { EmbeddingProvider, GoogleEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface GoogleClient {
  models: {
    embedContent(args: {
      model: string;
      contents:
        | Array<{
            parts: Array<{ text: string }>;
          }>
        | string;
      config?: {
        outputDimensionality?: number;
        taskType?: string;
      };
    }): Promise<{
      embeddings?: Array<{
        values?: number[];
      }>;
      embedding?: {
        values?: number[];
      };
    }>;
  };
}

const MAX_BATCH_SIZE = 250;

export function googleEmbedding(
  client: GoogleClient,
  options: GoogleEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "gemini-embedding-2";

  async function embedMany(
    texts: string[],
    type: "document" | "query" = "document",
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const taskType =
        type === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";

      const config = {
        ...(options.dimensions !== undefined
          ? { outputDimensionality: options.dimensions }
          : {}),
        taskType,
      };

      const response = await client.models.embedContent({
        model,
        contents: texts.map((text) => ({
          parts: [{ text }],
        })),
        config,
      });

      const embeddings = response.embeddings?.map((embedding) => {
        return embedding.values;
      });

      if (
        !embeddings ||
        embeddings.length !== texts.length ||
        embeddings.some((embedding): embedding is undefined => !embedding)
      ) {
        throw new ChatbotError(
          `Google returned ${embeddings?.length ?? 0} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings as number[][];
    } catch (error) {
      throwProviderError("Google", error);
    }
  }

  return {
    name: "google",
    model,
    maxBatchSize: MAX_BATCH_SIZE,

    async embed(text: string, type = "document") {
      const embeddings = await embedMany([text], type);
      return embeddings[0];
    },

    embedMany,
  };
}
