import {
  ChatbotRoot,
  ChatbotTrigger,
  ChatbotWindow,
  ChatbotHeader,
  ChatbotMessages,
  ChatbotInput,
} from "./ChatbotComponents.tsx";

import type { ChatbotProps } from "../types.ts";

export function Chatbot(props: ChatbotProps) {
  return (
    <ChatbotRoot {...props}>
      <ChatbotTrigger />

      <ChatbotWindow>
        <ChatbotHeader />
        <ChatbotMessages />
        <ChatbotInput />
      </ChatbotWindow>
    </ChatbotRoot>
  );
}
