import { EmbeddingProvider, GoogleEmbeddingOptions } from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface GoogleClient {
  models: {
    embedContent(args: {
      model: string;
      contents: string;
      config?: {
        outputDimensionality?: number;
      };
    }): Promise<{
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

    async embed(text: string, _type = "document") {
      try {
        const response = await client.models.embedContent({
          model,
          contents: text,
          config: {
            outputDimensionality: options.dimensions,
          },
        });

        const values = response.embeddings?.[0]?.values;

        if (!values) {
          throw new ChatbotError(
            "Google failed to return embedding values.",
            "PROVIDER",
          );
        }

        return values;
      } catch (error) {
        throwProviderError("Google", error);
      }
    },
  };
}
