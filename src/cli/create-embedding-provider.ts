import { createRequire } from "node:module";
import type { EmbeddingProvider } from "../types.ts";
import type { EmbeddingProviderName } from "./providers.ts";

const require = createRequire(import.meta.url);

export interface CreateEmbeddingProviderOptions {
  dimensions: number;
}

export async function createEmbeddingProvider(
  providerName: EmbeddingProviderName,
  model: string,
  options: CreateEmbeddingProviderOptions,
): Promise<EmbeddingProvider> {
  switch (providerName) {
    case "google": {
      const { GoogleGenAI } = require("@google/genai");

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Missing API key.\n\nSet GOOGLE_GENERATIVE_AI_API_KEY in your environment.",
        );
      }

      const client = new GoogleGenAI({
        apiKey,
      });

      const { googleEmbedding } =
        await import("../providers/google/embedding.ts");

      return googleEmbedding(client, {
        model,
        dimensions: options.dimensions,
      });
    }

    case "openai": {
      const { default: OpenAI } = require("openai");

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Missing API key.\n\nSet OPENAI_API_KEY in your environment.",
        );
      }

      const client = new OpenAI({
        apiKey,
      });

      const { openAIEmbedding } =
        await import("../providers/openai/embedding.ts");

      return openAIEmbedding(client, {
        model,
        dimensions: options.dimensions,
      });
    }

    case "voyage": {
      const { VoyageAIClient } = require("voyageai");

      const apiKey = process.env.VOYAGE_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Missing API key.\n\nSet VOYAGE_API_KEY in your environment.",
        );
      }

      const client = new VoyageAIClient({
        apiKey,
      });

      const { voyageEmbedding } =
        await import("../providers/voyage/embedding.ts");

      return voyageEmbedding(client, {
        model,
        dimensions: options.dimensions,
      });
    }

    case "cohere": {
      const { CohereClientV2 } = require("cohere-ai");

      const apiKey = process.env.COHERE_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Missing API key.\n\nSet COHERE_API_KEY in your environment.",
        );
      }

      const client = new CohereClientV2({
        token: apiKey,
      });

      const { cohereEmbedding } =
        await import("../providers/cohere/embedding.ts");

      return cohereEmbedding(client, {
        model,
        dimensions: options.dimensions,
      });
    }

    case "jina": {
      const apiKey = process.env.JINA_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Missing API key.\n\nSet JINA_API_KEY in your environment.",
        );
      }

      const { createJinaClient } = await import("../providers/jina/client.ts");

      const client = createJinaClient({
        apiKey,
      });

      const { jinaEmbedding } = await import("../providers/jina/embedding.ts");

      return jinaEmbedding(client, {
        model,
        dimensions: options.dimensions,
      });
    }

    case "huggingface": {
      const { InferenceClient } = require("@huggingface/inference");

      const apiKey = process.env.HF_TOKEN;

      if (!apiKey) {
        throw new Error(
          "Missing API key.\n\nSet HF_TOKEN in your environment.",
        );
      }

      const client = new InferenceClient(apiKey);

      const { huggingFaceEmbedding } =
        await import("../providers/huggingface/embedding.ts");

      return huggingFaceEmbedding(client, {
        model,
        dimensions: options.dimensions,
      });
    }

    default:
      throw new Error(
        `Provider "${providerName}" is not supported by the CLI yet.`,
      );
  }
}
