import type { EmbeddingProvider, OpenAIEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface OpenAIClient {
  embeddings: {
    create(args: {
      model: string;
      input: string;
      dimensions?: number;
    }): Promise<{
      data: {
        embedding: number[];
      }[];
    }>;
  };
}

export function openAIEmbedding(
  client: OpenAIClient,
  options: OpenAIEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "text-embedding-3-small";

  return {
    name: "openai",
    model,

    async embed(text: string, _type = "document"): Promise<number[]> {
      try {
        const response = await client.embeddings.create({
          model,
          input: text,
          dimensions: options.dimensions,
        });

        const embedding = response.data?.[0]?.embedding;

        if (!embedding) {
          throw new ChatbotError(
            "Failed to generate embedding values from OpenAI.",
          );
        }

        return embedding;
      } catch (error) {
        throwProviderError("OpenAI", error);
      }
    },
  };
}
