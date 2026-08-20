"use client";

import Markdown from "react-markdown";
import styles from "./Chatbot.module.css";

import { ChatbotProvider, useChatbotContext } from "./ChatbotContext.tsx";

import type { ChatbotProps } from "../types.ts";

export function Chatbot(props: ChatbotProps) {
  return (
    <ChatbotProvider
      apiEndpoint={props.apiEndpoint}
      initialOpen={props.initialOpen}
      position={props.position}
      themeMode={props.themeMode}
      theme={props.theme}
      onError={props.onError}
    >
      <ChatbotUI {...props} />
    </ChatbotProvider>
  );
}

function ChatbotUI({
  title = "Ask AI Assistant",
  subtitle = "Trained on custom project data and experience",
  triggerText = "Ask AI",
  triggerIcon,
  sendIcon,
  closeIcon,
  position = "bottom-right",
  starterPrompts = [
    "What is the main tech stack?",
    "Tell me about key projects.",
    "Is this service available for work?",
  ],
  emptyStateText = "👋 Hi! Ask me anything about skills, portfolio projects, or background.",
  placeholder = "Ask a question...",
  starterPromptsLabel = "Try asking:",
  classNames,
}: ChatbotProps) {
  const {
    isOpen,
    setIsOpen,
    input,
    setInput,
    messages,
    isLoading,
    handleSubmit,
    themeMode,
    themeStyles,
  } = useChatbotContext();

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
          type="button"
          onClick={() => setIsOpen(true)}
          className={`${styles.trigger} ${classNames?.trigger ?? ""}`.trim()}
          aria-label="Open Chatbot"
        >
          {triggerIcon ?? (
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
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}

          <span className={styles.triggerText}>{triggerText}</span>
        </button>
      )}

      {isOpen && (
        <div className={`${styles.window} ${classNames?.window ?? ""}`.trim()}>
          <header
            className={`${styles.header} ${classNames?.header ?? ""}`.trim()}
          >
            <div className={styles.headerContent}>
              <h3 className={styles.title}>{title}</h3>

              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Close Chatbot"
            >
              {closeIcon ?? (
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
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          </header>

          <div className={styles.messagesContainer}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateText}>{emptyStateText}</div>

                {starterPrompts.length > 0 && (
                  <div className={styles.starterPromptsContainer}>
                    <p className={styles.starterPromptsLabel}>
                      {starterPromptsLabel}
                    </p>

                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
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

            <div className={styles.messageList}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.message} ${
                    message.role === "user"
                      ? styles.userMessage
                      : styles.botMessage
                  }`}
                  data-message-id={message.id}
                  data-role={message.role}
                >
                  {message.parts.map((part, index) => {
                    if (part.type !== "text") return null;

                    if (message.role === "user") {
                      return (
                        <div
                          key={`${message.id}-${index}`}
                          className={styles.markdownWrapper}
                        >
                          <span>{part.text}</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${message.id}-${index}`}
                        className={styles.markdownWrapper}
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
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder={placeholder}
              className={styles.inputField}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={styles.sendButton}
              aria-label="Send message"
            >
              {sendIcon ?? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.iconSm}
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
