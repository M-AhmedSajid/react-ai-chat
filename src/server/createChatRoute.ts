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
  systemPrompt = "You are a helpful AI assistant.",
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

      // console.log(`\n🔍 [next-ai-chatbot] Extracted User Query: "${userText}"`);

      if (userText.trim()) {
        try {
          // console.log(
          //   `⚙️ [next-ai-chatbot] Generating query embedding via provider...`,
          // );

          const topChunks = await retrieveContext({
            question: userText,
            embeddings: rag.embeddings,
            embedFn: (text) => rag.provider.embed(text),
            topK: rag.topK ?? 3,
          });

          // console.log(
          //   `\n📚 [next-ai-chatbot] Top Retrieved Chunks (${topChunks.length}):`,
          // );
          topChunks.forEach((chunk, index) => {
            // console.log(
            //   `   [${index + 1}] File/ID: ${chunk.id || chunk.source}`,
            // );
            // console.log(`       Score: ${chunk.score?.toFixed(4) ?? "N/A"}`);
            // console.log(
            //   `       Preview: "${chunk.text.slice(0, 80).replace(/\n/g, " ")}..."`,
            // );
          });

          contextString = formatContext(topChunks);
        } catch (error) {
          console.error(
            "❌ [next-ai-chatbot] Error during RAG retrieval:",
            error,
          );
        }
      } else {
        // console.log(
        //   "⚠️ [next-ai-chatbot] Last user message text was empty or space-only.",
        // );
      }
    }

    const finalSystemPrompt = contextString
      ? `${systemPrompt}\n\nYou are provided with reference documents.\n\nBase every factual answer on these references.\n\nIf the answer cannot be found in the references, clearly say you don't have enough information instead of guessing.\n\n=== REFERENCES ===\n${contextString}\n==================`
      : systemPrompt;

    // console.log("\n📝 [next-ai-chatbot] System Prompt Sent to Model:");
    // console.log("------------------------------------------------");
    // console.log(finalSystemPrompt);
    // console.log("------------------------------------------------\n");

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
