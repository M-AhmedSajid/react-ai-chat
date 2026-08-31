import type { EmbeddingProvider, OpenAIEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface OpenAIClient {
  embeddings: {
    create(args: {
      model: string;
      input: string[];
      dimensions?: number;
    }): Promise<{
      data?: Array<{
        embedding?: number[];
      }>;
    }>;
  };
}

const MAX_BATCH_SIZE = 2048;

export function openAIEmbedding(
  client: OpenAIClient,
  options: OpenAIEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "text-embedding-3-small";

  async function embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await client.embeddings.create({
        model,
        input: texts,
        ...(options.dimensions !== undefined
          ? { dimensions: options.dimensions }
          : {}),
      });

      const embeddings = response.data?.map((item) => item.embedding);

      if (
        !embeddings ||
        embeddings.length !== texts.length ||
        embeddings.some((embedding) => !embedding)
      ) {
        throw new ChatbotError(
          `OpenAI returned ${embeddings?.length ?? 0} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings as number[][];
    } catch (error) {
      throwProviderError("OpenAI", error);
    }
  }

  return {
    name: "openai",
    model,
    maxBatchSize: MAX_BATCH_SIZE,

    async embed(text: string) {
      const embeddings = await embedMany([text]);
      return embeddings[0];
    },

    embedMany,
  };
}
