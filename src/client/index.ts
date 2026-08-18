import { Chatbot as MonolithicChatbot } from "./Chatbot.tsx";

import {
  ChatbotRoot,
  ChatbotTrigger,
  ChatbotWindow,
  ChatbotHeader,
  ChatbotMessages,
  ChatbotInput,
} from "./ChatbotComponents.tsx";

export const Chatbot = Object.assign(MonolithicChatbot, {
  Root: ChatbotRoot,
  Trigger: ChatbotTrigger,
  Window: ChatbotWindow,
  Header: ChatbotHeader,
  Messages: ChatbotMessages,
  Input: ChatbotInput,
});

export {
  ChatbotRoot,
  ChatbotTrigger,
  ChatbotWindow,
  ChatbotHeader,
  ChatbotMessages,
  ChatbotInput,
};

export { useChatbotContext, ChatbotProvider } from "./ChatbotContext.tsx";

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
