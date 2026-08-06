"use client";

import { ReactNode } from "react";
import Markdown from "react-markdown";
import styles from "./Chatbot.module.css";
import {
  ChatbotProvider,
  ChatbotProviderProps,
  useChatbotContext,
} from "./ChatbotContext.tsx";

/* -------------------------------------------------------------------------- */
/*                                1. Chatbot.Root                            */
/* -------------------------------------------------------------------------- */

export interface ChatbotRootProps extends ChatbotProviderProps {
  className?: string;
}

export function ChatbotRoot({
  children,
  className = "",
  ...providerProps
}: ChatbotRootProps) {
  return (
    <ChatbotProvider {...providerProps}>
      <ChatbotRootInner className={className}>{children}</ChatbotRootInner>
    </ChatbotProvider>
  );
}

function ChatbotRootInner({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { position, themeStyles, themeMode } = useChatbotContext();

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
      className={`${styles.wrapper} ${positionClass} ${className}`.trim()}
      style={themeStyles}
      data-theme={themeMode !== "auto" ? themeMode : undefined}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              2. Chatbot.Trigger                           */
/* -------------------------------------------------------------------------- */

export interface ChatbotTriggerProps {
  children?: ReactNode;
  icon?: ReactNode;
  text?: string;
  className?: string;
}

export function ChatbotTrigger({
  children,
  icon = (
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
  text = "Ask AI",
  className = "",
}: ChatbotTriggerProps) {
  const { isOpen, setIsOpen } = useChatbotContext();

  if (isOpen) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className={`${styles.trigger} ${className}`.trim()}
      aria-label="Open Chatbot"
    >
      {children ?? (
        <>
          {icon}
          <span className={styles.triggerText}>{text}</span>
        </>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                               3. Chatbot.Window                           */
/* -------------------------------------------------------------------------- */

export interface ChatbotWindowProps {
  children: ReactNode;
  className?: string;
}

export function ChatbotWindow({
  children,
  className = "",
}: ChatbotWindowProps) {
  const { isOpen } = useChatbotContext();

  if (!isOpen) return null;

  return (
    <div className={`${styles.window} ${className}`.trim()}>{children}</div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               4. Chatbot.Header                           */
/* -------------------------------------------------------------------------- */

export interface ChatbotHeaderProps {
  title?: string;
  subtitle?: string;
  closeIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ChatbotHeader({
  title = "Ask AI Assistant",
  subtitle = "Trained on custom project data and experience",
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
  children,
  className = "",
}: ChatbotHeaderProps) {
  const { setIsOpen } = useChatbotContext();

  return (
    <div className={`${styles.header} ${className}`.trim()}>
      {children ?? (
        <>
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
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              5. Chatbot.Messages                          */
/* -------------------------------------------------------------------------- */

export interface ChatbotMessagesProps {
  emptyStateText?: string;
  starterPrompts?: string[];
  starterPromptsLabel?: string;
  className?: string;
}

export function ChatbotMessages({
  emptyStateText = "👋 Hi! Ask me anything about skills, portfolio projects, or background.",
  starterPrompts = [
    "What is the main tech stack?",
    "Tell me about key projects.",
    "Is this service available for work?",
  ],
  starterPromptsLabel = "Try asking:",
  className = "",
}: ChatbotMessagesProps) {
  const { messages, isLoading, handleSubmit } = useChatbotContext();

  return (
    <div className={`${styles.messagesContainer} ${className}`.trim()}>
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
              <div className={styles.markdownWrapper} key={`${m.id}-${i}`}>
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
  );
}

/* -------------------------------------------------------------------------- */
/*                                6. Chatbot.Input                           */
/* -------------------------------------------------------------------------- */

export interface ChatbotInputProps {
  placeholder?: string;
  sendIcon?: ReactNode;
  className?: string;
}

export function ChatbotInput({
  placeholder = "Ask a question...",
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
  className = "",
}: ChatbotInputProps) {
  const { input, setInput, handleSubmit, isLoading } = useChatbotContext();

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.inputForm} ${className}`.trim()}
    >
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
  );
}
