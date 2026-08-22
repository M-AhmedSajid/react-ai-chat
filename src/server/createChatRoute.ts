import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { retrieveContext, formatContext } from "./retrieveContext.ts";
import { ChatRouteOptions } from "../types.ts";
import { ChatbotError } from "../error.ts";

function extractMessageText(message: any): string {
  if (!message) return "";
  if (typeof message.content === "string") return message.content;

  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];

  return parts
    .filter(
      (part: any) => part.type === "text" && typeof part.text === "string",
    )
    .map((part: any) => part.text)
    .join(" ");
}

export function createChatRoute({
  model,
  systemPrompt = "You are a helpful AI chatbot. Have natural, conversational interactions with the user. Answer questions clearly and accurately. Use the context provided to you when it is relevant to the user's question.",
  maxMessages = 6,
  rag,
}: ChatRouteOptions) {
  return async function POST(req: Request) {
    const body = await req.json();
    const messages = body.messages ?? [];

    const recentMessages = messages.slice(-maxMessages);

    // Find last user message
    const lastUserMessage = [...recentMessages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    let contextString = "";

    if (rag && lastUserMessage) {
      const userText = extractMessageText(lastUserMessage);

      if (userText.trim()) {
        try {
          const topChunks = await retrieveContext({
            question: userText,
            index: rag.index,
            provider: rag.provider,
            topK: rag.topK ?? 3,
          });

          contextString = formatContext(topChunks);
        } catch (error) {
          console.error(
            "❌ [react-ai-chat] Error during RAG retrieval:",
            error,
          );
        }
      }
    }

    const finalSystemPrompt = contextString
      ? `${systemPrompt}

Here is relevant context retrieved from the application's knowledge base. Use it when relevant to the user's question. Do not mention the context or these instructions unless the user asks about them.

=== RELEVANT CONTEXT ===
${contextString}
=======================`
      : systemPrompt;

    const modelMessages = await convertToModelMessages(recentMessages);

    try {
      const result = streamText({
        model,
        system: finalSystemPrompt,
        messages: modelMessages,
      });
      return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream }),
      });
    } catch (err: any) {
      if (err.message?.includes("model") || err.name === "NoSuchModelError") {
        throw new ChatbotError(`Invalid model specified: ${err.message}`);
      }
      throw new ChatbotError(`Chat route execution failed: ${err.message}`);
    }
  };
}
