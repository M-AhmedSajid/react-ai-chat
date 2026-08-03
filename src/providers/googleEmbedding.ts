import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { EmbeddingProvider, GoogleEmbeddingOptions } from "../types.ts";
import { ChatbotError } from "../error.ts";

export function googleEmbedding(
  options: GoogleEmbeddingOptions = {},
): EmbeddingProvider {
  const apiKey =
    options.apiKey ||
    process.env.CHATBOT_EMBEDDING_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new ChatbotError(
      "Missing API key for Google Embeddings. Set CHATBOT_EMBEDDING_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = options.model || "gemini-embedding-001";

  return {
    name: "google",
    async embed(text: string): Promise<number[]> {
      try {
        const result = await ai.models.embedContent({
          model: modelName,
          contents: text,
        });

        if (!result.embeddings?.[0]?.values) {
          throw new ChatbotError(
            "Failed to generate embedding values from Gemini API.",
          );
        }

        return result.embeddings[0].values;
      } catch (err: any) {
        if (err instanceof ChatbotError) throw err;
        throw new ChatbotError(
          `Google Embedding API Error: ${err.message || err}`,
        );
      }
    },
  };
}
