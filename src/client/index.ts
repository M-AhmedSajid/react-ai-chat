import { Chatbot as MonolithicChatbot } from "./Chatbot.tsx";
import {
  ChatbotRoot,
  ChatbotTrigger,
  ChatbotWindow,
  ChatbotHeader,
  ChatbotMessages,
  ChatbotInput,
} from "./ChatbotComponents.tsx";

// 1. Attach compound components directly to the main Chatbot export
export const Chatbot = Object.assign(MonolithicChatbot, {
  Root: ChatbotRoot,
  Trigger: ChatbotTrigger,
  Window: ChatbotWindow,
  Header: ChatbotHeader,
  Messages: ChatbotMessages,
  Input: ChatbotInput,
});

// 2. Named exports for standalone usage
export {
  ChatbotRoot,
  ChatbotTrigger,
  ChatbotWindow,
  ChatbotHeader,
  ChatbotMessages,
  ChatbotInput,
};

// 3. Export context hook for developers building custom subcomponents
export { useChatbotContext } from "./ChatbotContext.tsx";

// 4. Export type definitions
export type {
  ChatbotProps,
  ChatbotTheme,
  ChatbotThemeTokens,
} from "../types.ts";
export type {
  ChatbotRootProps,
  ChatbotTriggerProps,
  ChatbotWindowProps,
  ChatbotHeaderProps,
  ChatbotMessagesProps,
  ChatbotInputProps,
} from "./ChatbotComponents.tsx";
