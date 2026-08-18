import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  CSSProperties,
  SubmitEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatbotTheme, ChatbotThemeTokens } from "../types.ts";

interface ChatbotContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  input: string;
  setInput: (input: string) => void;
  messages: ReturnType<typeof useChat>["messages"];
  status: ReturnType<typeof useChat>["status"];
  isLoading: boolean;
  handleSubmit: (
    e?: SubmitEvent<HTMLFormElement>,
    customText?: string,
  ) => Promise<void>;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  themeMode: "auto" | "light" | "dark";
  themeStyles: CSSProperties;
}

const ChatbotContext = createContext<ChatbotContextValue | undefined>(
  undefined,
);

export interface ChatbotProviderProps {
  children: ReactNode;
  apiEndpoint?: string;
  initialOpen?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  themeMode?: "auto" | "light" | "dark";
  theme?: ChatbotTheme;
  onError?: (error: Error) => void;
}

export function ChatbotProvider({
  children,
  apiEndpoint,
  initialOpen = false,
  position = "bottom-right",
  themeMode = "auto",
  theme,
  onError,
}: ChatbotProviderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [input, setInput] = useState<string>("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport(
      apiEndpoint ? { api: apiEndpoint } : {},
    ),
  });

  const isLoading = status === "submitted" || status === "streaming";

  async function handleSubmit(
    e?: { preventDefault: () => void },
    customText?: string,
  ) {
    if (e) e.preventDefault();
    const textToSend = customText || input;

    if (!textToSend.trim()) return;

    setInput("");
    await sendMessage({ text: textToSend });
  }

  // Handle body scroll locking when mobile/fullscreen or open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.setAttribute("data-scroll-locked", "1");
    } else {
      document.documentElement.removeAttribute("data-scroll-locked");
    }
    return () => {
      document.documentElement.removeAttribute("data-scroll-locked");
    };
  }, [isOpen]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Helper to convert theme tokens into CSS custom properties
  const getCssVars = (
    tokens?: ChatbotThemeTokens,
    prefix: string = "--cb-",
  ): CSSProperties => {
    if (!tokens) return {};
    const vars: Record<string, string> = {};

    if (tokens.primaryColor) vars[`${prefix}primary`] = tokens.primaryColor;
    if (tokens.primaryForeground)
      vars[`${prefix}primary-fg`] = tokens.primaryForeground;
    if (tokens.background) vars[`${prefix}bg`] = tokens.background;
    if (tokens.foreground) vars[`${prefix}fg`] = tokens.foreground;
    if (tokens.mutedBackground)
      vars[`${prefix}muted-bg`] = tokens.mutedBackground;
    if (tokens.mutedForeground)
      vars[`${prefix}muted-fg`] = tokens.mutedForeground;
    if (tokens.borderColor) vars[`${prefix}border`] = tokens.borderColor;

    return vars as CSSProperties;
  };

  // Build combined CSS variables supporting flat values as well as light/dark overrides
  const themeStyles: CSSProperties = {
    ...getCssVars(theme),
    ...getCssVars(theme?.light, "--cb-light-"),
    ...getCssVars(theme?.dark, "--cb-dark-"),
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        input,
        setInput,
        messages,
        status,
        isLoading,
        handleSubmit,
        position,
        themeMode,
        themeStyles,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbotContext must be used within a ChatbotProvider");
  }
  return context;
}
