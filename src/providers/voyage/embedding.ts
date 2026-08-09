import { EmbeddingProvider, VoyageEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";

interface VoyageClient {
  embed(args: {
    input: string[];
    model: string;
    input_type?: "query" | "document";
  }): Promise<{
    data?: {
      embedding?: number[];
    }[];
  }>;
}

export function voyageEmbedding(
  client: VoyageClient,
  options: VoyageEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "voyage-4-lite";

  return {
    name: "voyage",
    model,

    async embed(text: string, type = "document") {
      try {
        const response = await client.embed({
          input: [text],
          model,
          input_type: type,
        });

        const embedding = response.data?.[0]?.embedding;

        if (!embedding) {
          throw new ChatbotError("Voyage failed to return embedding values.");
        }

        return embedding;
      } catch (error) {
        if (error instanceof ChatbotError) {
          throw error;
        }

        throw new ChatbotError(`Voyage embedding error: ${error}`);
      }
    },
  };
}
