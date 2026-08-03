"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, ReactNode, CSSProperties } from "react";
import Markdown from "react-markdown";
import styles from "./Chatbot.module.css";
import { ChatbotProps } from "../types.ts";

export function Chatbot({
  title = "Ask AI Assistant",
  subtitle = "Trained on custom project data and experience",
  triggerText = "Ask AI",
  triggerIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.iconMd}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  sendIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.iconSm}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  closeIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.iconSm}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  position = "bottom-right",
  starterPrompts = [
    "What is the main tech stack?",
    "Tell me about key projects.",
    "Is this service available for work?",
  ],
  emptyStateText = "👋 Hi! Ask me anything about skills, portfolio projects, or background.",
  placeholder = "Ask a question...",
  starterPromptsLabel = "Try asking:",
  apiEndpoint,
  initialOpen = false,
  themeMode = "auto",
  classNames,
  theme,
  onError,
}: ChatbotProps) {
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

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error]);

  // Convert theme object into inline CSS variables on the root wrapper
  const themeStyles: CSSProperties = {
    ...(theme?.primaryColor && { "--cb-primary": theme.primaryColor }),
    ...(theme?.primaryForeground && {
      "--cb-primary-fg": theme.primaryForeground,
    }),
    ...(theme?.background && { "--cb-bg": theme.background }),
    ...(theme?.foreground && { "--cb-fg": theme.foreground }),
    ...(theme?.mutedBackground && { "--cb-muted-bg": theme.mutedBackground }),
    ...(theme?.mutedForeground && { "--cb-muted-fg": theme.mutedForeground }),
    ...(theme?.borderColor && { "--cb-border": theme.borderColor }),
  } as CSSProperties;

  // Map position prop to corresponding CSS class name
  const positionClass =
    position === "bottom-left"
      ? styles.bottomLeft
      : position === "top-right"
        ? styles.topRight
        : position === "top-left"
          ? styles.topLeft
          : styles.bottomRight;

  return (
    <div
      className={`${styles.wrapper} ${positionClass} ${classNames?.wrapper ?? ""}`.trim()}
      style={themeStyles}
      data-theme={themeMode !== "auto" ? themeMode : undefined}
    >
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`${styles.trigger} ${classNames?.trigger ?? ""}`.trim()}
          aria-label="Open Chatbot"
        >
          {triggerIcon}
          <span className={styles.triggerText}>{triggerText}</span>
        </button>
      )}

      {isOpen && (
        <div className={`${styles.window} ${classNames?.window ?? ""}`.trim()}>
          {/* Header */}
          <div className={`${styles.header} ${classNames?.header ?? ""}`.trim()}>
            <div>
              <h3 className={styles.title}>{title}</h3>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Close Chatbot"
            >
              {closeIcon}
            </button>
          </div>

          {/* Messages Container */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                {emptyStateText && (
                  <div className={styles.emptyStateText}>{emptyStateText}</div>
                )}

                {starterPrompts.length > 0 && (
                  <div className={styles.starterPromptsContainer}>
                    {starterPromptsLabel && (
                      <p className={styles.starterPromptsLabel}>
                        {starterPromptsLabel}
                      </p>
                    )}
                    {starterPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSubmit(undefined, prompt)}
                        className={styles.promptChip}
                      >
                        <span>{prompt}</span>
                        <span className={styles.arrowIcon}>→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.message} ${
                  m.role === "user" ? styles.userMessage : styles.botMessage
                }`}
              >
                {m.parts.map((part, i) => {
                  if (part.type !== "text") return null;

                  return (
                    <div
                      className={styles.markdownWrapper}
                      key={`${m.id}-${i}`}
                    >
                      <Markdown>{part.text}</Markdown>
                    </div>
                  );
                })}
              </div>
            ))}

            {isLoading && (
              <div className={styles.loadingBubble}>
                Thinking
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder={placeholder}
              className={styles.inputField}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.length}
              className={styles.sendButton}
            >
              {sendIcon}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
