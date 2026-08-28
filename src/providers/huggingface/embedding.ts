import type {
  EmbeddingProvider,
  HuggingFaceEmbeddingOptions,
} from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface HuggingFaceClient {
  featureExtraction(args: {
    model: string;
    inputs: string;
    provider?: "hf-inference";
  }): Promise<unknown>;
}

export function huggingFaceEmbedding(
  client: HuggingFaceClient,
  options: HuggingFaceEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "Qwen/Qwen3-Embedding-0.6B";

  return {
    name: "huggingface",
    model,

    async embed(text: string) {
      try {
        const response = await client.featureExtraction({
          model,
          inputs: text,
          provider: "hf-inference",
        });

        const embedding = normalizeEmbedding(response);

        if (!embedding) {
          throw new ChatbotError(
            "Hugging Face failed to return embedding values.",
          );
        }

        return embedding;
      } catch (error) {
        throwProviderError("Hugging Face", error);
      }
    },
  };
}

function normalizeEmbedding(data: unknown): number[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  if (data.every((value) => typeof value === "number")) {
    return data as number[];
  }

  if (
    data.length === 1 &&
    Array.isArray(data[0]) &&
    data[0].every((value) => typeof value === "number")
  ) {
    return data[0] as number[];
  }

  return null;
}
