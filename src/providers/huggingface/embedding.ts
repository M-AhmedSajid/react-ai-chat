import type {
  EmbeddingProvider,
  HuggingFaceEmbeddingOptions,
} from "../../types.ts";
import { ChatbotError } from "../../error.ts";
import { throwProviderError } from "../utils.ts";

interface HuggingFaceClient {
  featureExtraction(args: {
    model: string;
    inputs: string | string[];
    provider?: "hf-inference";
  }): Promise<unknown>;
}

const MAX_BATCH_SIZE = 32;

export function huggingFaceEmbedding(
  client: HuggingFaceClient,
  options: HuggingFaceEmbeddingOptions = {},
): EmbeddingProvider {
  const model = options.model ?? "Qwen/Qwen3-Embedding-0.6B";

  async function embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await client.featureExtraction({
        model,
        inputs: texts,
        provider: "hf-inference",
      });

      const embeddings = normalizeEmbeddings(response);

      if (!embeddings || embeddings.length !== texts.length) {
        throw new ChatbotError(
          `Hugging Face returned ${embeddings?.length ?? 0} embeddings for ${texts.length} texts.`,
        );
      }

      return embeddings;
    } catch (error) {
      throwProviderError("Hugging Face", error);
    }
  }

  return {
    name: "huggingface",
    model,
    maxBatchSize: MAX_BATCH_SIZE,

    async embed(text: string) {
      const embeddings = await embedMany([text]);
      return embeddings[0];
    },

    embedMany,
  };
}

function normalizeEmbeddings(data: unknown): number[][] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  if (
    data.every(
      (value) =>
        Array.isArray(value) && value.every((item) => typeof item === "number"),
    )
  ) {
    return data as number[][];
  }

  return null;
}
