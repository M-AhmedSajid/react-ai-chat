import { EmbeddingProvider, GoogleEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";

interface GoogleClient {
  models: {
    embedContent(args: { model: string; contents: string }): Promise<{
      embeddings?: {
        values?: number[];
      }[];
    }>;
  };
}

export function googleEmbedding(
  client: GoogleClient,
  options: GoogleEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "gemini-embedding-001";

  return {
    name: "google",
    model,
    async embed(text: string) {
      try {
        const response = await client.models.embedContent({
          model,
          contents: text,
        });

        const values = response.embeddings?.[0]?.values;

        if (!values) {
          throw new ChatbotError("Google failed to return embedding values.");
        }

        return values;
      } catch (error) {
        if (error instanceof ChatbotError) {
          throw error;
        }

        throw new ChatbotError(`Google embedding error: ${error}`);
      }
    },
  };
}
