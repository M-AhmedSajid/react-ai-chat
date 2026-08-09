import { ChatbotError } from "../../error.ts";

export interface JinaClient {
  embeddings: {
    create(args: {
      model: string;
      input: string[];
      task?: "retrieval.query" | "retrieval.passage";
    }): Promise<{
      data?: {
        embedding?: number[];
      }[];
    }>;
  };
}

export interface CreateJinaClientOptions {
  apiKey: string;
  baseURL?: string;
}

export function createJinaClient({
  apiKey,
  baseURL = "https://api.jina.ai/v1",
}: CreateJinaClientOptions): JinaClient {
  if (!apiKey) {
    throw new ChatbotError("Jina API key is required.");
  }

  return {
    embeddings: {
      async create({ model, input, task }) {
        const response = await fetch(`${baseURL}/embeddings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input,
            ...(task && { task }),
          }),
        });

        if (!response.ok) {
          const error = await response.text();

          throw new ChatbotError(
            `Jina API error (${response.status}): ${error}`,
          );
        }

        return response.json();
      },
    },
  };
}
