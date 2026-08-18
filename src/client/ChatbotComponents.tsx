import { ReactNode, FormEvent } from "react";
import Markdown from "react-markdown";
import styles from "./Chatbot.module.css";
import {
  ChatbotProvider,
  ChatbotProviderProps,
  useChatbotContext,
} from "./ChatbotContext.tsx";

/* -------------------------------------------------------------------------- */
/*                                    Root                                    */
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
/*                                  Trigger                                   */
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
      type="button"
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
/*                                   Window                                   */
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
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotHeaderProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  closeIcon?: ReactNode;
  className?: string;
}

export function ChatbotHeader({
  children,
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
  className = "",
}: ChatbotHeaderProps) {
  const { setIsOpen } = useChatbotContext();

  return (
    <header className={`${styles.header} ${className}`.trim()}>
      {children ?? (
        <>
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
            {closeIcon}
          </button>
        </>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Title                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotTitleProps {
  children?: ReactNode;
  title?: string;
  className?: string;
}

export function ChatbotTitle({
  children,
  title = "Ask AI Assistant",
  className = "",
}: ChatbotTitleProps) {
  return (
    <h3 className={`${styles.title} ${className}`.trim()}>
      {children ?? title}
    </h3>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Subtitle                                  */
/* -------------------------------------------------------------------------- */

export interface ChatbotSubtitleProps {
  children?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function ChatbotSubtitle({
  children,
  subtitle = "Trained on custom project data and experience",
  className = "",
}: ChatbotSubtitleProps) {
  if (!children && !subtitle) return null;

  return (
    <p className={`${styles.subtitle} ${className}`.trim()}>
      {children ?? subtitle}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Close                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotCloseProps {
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function ChatbotClose({
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
      className={styles.iconSm}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  className = "",
  ariaLabel = "Close Chatbot",
}: ChatbotCloseProps) {
  const { setIsOpen } = useChatbotContext();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(false)}
      className={`${styles.closeButton} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {children ?? icon}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Messages                                  */
/* -------------------------------------------------------------------------- */

function DefaultMessages() {
  const { messages, isLoading, handleSubmit } = useChatbotContext();

  return (
    <>
      {messages.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateText}>
            👋 Hi! Ask me anything about skills, portfolio projects, or
            background.
          </div>

          <div className={styles.starterPromptsContainer}>
            <p className={styles.starterPromptsLabel}>Try asking:</p>

            {[
              "What is the main tech stack?",
              "Tell me about key projects.",
              "Is this service available for work?",
            ].map((prompt) => (
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
        </div>
      )}

      <div className={styles.messageList}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.role === "user" ? styles.userMessage : styles.botMessage
            }`}
          >
            {message.parts.map((part, index) => {
              if (part.type !== "text") return null;

              return (
                <div
                  key={`${message.id}-${index}`}
                  className={styles.markdownWrapper}
                >
                  {message.role === "user" ? (
                    <span>{part.text}</span>
                  ) : (
                    <Markdown>{part.text}</Markdown>
                  )}
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
    </>
  );
}

export interface ChatbotMessagesProps {
  children?: ReactNode;
  className?: string;
}

export function ChatbotMessages({
  children,
  className = "",
}: ChatbotMessagesProps) {
  return (
    <div className={`${styles.messagesContainer} ${className}`.trim()}>
      {children ?? <DefaultMessages />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Empty                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotEmptyProps {
  children?: ReactNode;
  className?: string;
}

export function ChatbotEmpty({ children, className = "" }: ChatbotEmptyProps) {
  const { messages } = useChatbotContext();

  if (messages.length > 0) return null;

  return (
    <div className={`${styles.emptyState} ${className}`.trim()}>{children}</div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Empty Message                                */
/* -------------------------------------------------------------------------- */

export interface ChatbotEmptyMessageProps {
  children?: ReactNode;
  text?: string;
  className?: string;
}

export function ChatbotEmptyMessage({
  children,
  text = "👋 Hi! Ask me anything about skills, portfolio projects, or background.",
  className = "",
}: ChatbotEmptyMessageProps) {
  if (!children && !text) return null;

  return (
    <div className={`${styles.emptyStateText} ${className}`.trim()}>
      {children ?? text}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Starter Prompts                               */
/* -------------------------------------------------------------------------- */

export interface ChatbotStarterPromptsProps {
  children?: ReactNode;
  prompts?: string[];
  label?: string;
  className?: string;
}

export function ChatbotStarterPrompts({
  children,
  prompts = [
    "What is the main tech stack?",
    "Tell me about key projects.",
    "Is this service available for work?",
  ],
  label = "Try asking:",
  className = "",
}: ChatbotStarterPromptsProps) {
  return (
    <div className={`${styles.starterPromptsContainer} ${className}`.trim()}>
      {label && <p className={styles.starterPromptsLabel}>{label}</p>}

      {children ??
        prompts.map((prompt, index) => (
          <ChatbotStarterPrompt key={`${prompt}-${index}`} prompt={prompt} />
        ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Starter Prompt                                */
/* -------------------------------------------------------------------------- */

export interface ChatbotStarterPromptProps {
  prompt?: string;
  children?: ReactNode;
  className?: string;
}

export function ChatbotStarterPrompt({
  prompt = "",
  children,
  className = "",
}: ChatbotStarterPromptProps) {
  const { handleSubmit } = useChatbotContext();

  const content = children ?? prompt;

  return (
    <button
      type="button"
      onClick={() => {
        if (prompt) {
          handleSubmit(undefined, prompt);
        }
      }}
      className={`${styles.promptChip} ${className}`.trim()}
    >
      <span>{content}</span>
      <span className={styles.arrowIcon}>→</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Message List                                 */
/* -------------------------------------------------------------------------- */

export interface ChatbotMessageListProps {
  children?: ReactNode;
  className?: string;
}

export function ChatbotMessageList({
  children,
  className = "",
}: ChatbotMessageListProps) {
  const { messages } = useChatbotContext();

  if (children) {
    return (
      <div className={`${styles.messageList} ${className}`.trim()}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${styles.messageList} ${className}`.trim()}>
      {messages.map((message) => (
        <ChatbotMessage key={message.id} messageId={message.id} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Message                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotMessageProps {
  children?: ReactNode;
  messageId?: string;
  className?: string;
}

export function ChatbotMessage({
  children,
  messageId,
  className = "",
}: ChatbotMessageProps) {
  const { messages } = useChatbotContext();

  const message = messageId
    ? messages.find((item) => item.id === messageId)
    : undefined;

  if (!message) return null;

  const messageClass =
    message.role === "user" ? styles.userMessage : styles.botMessage;

  return (
    <div
      className={`${styles.message} ${messageClass} ${className}`.trim()}
      data-message-id={message.id}
      data-role={message.role}
    >
      {children ?? <ChatbotMessageContent messageId={message.id} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Message Avatar                                */
/* -------------------------------------------------------------------------- */

export interface ChatbotMessageAvatarProps {
  children?: ReactNode;
  className?: string;
}

export function ChatbotMessageAvatar({
  children,
  className = "",
}: ChatbotMessageAvatarProps) {
  if (!children) return null;

  return <div className={className}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/*                             Message Content                                */
/* -------------------------------------------------------------------------- */

export interface ChatbotMessageContentProps {
  messageId: string;
  children?: ReactNode;
  className?: string;
}

export function ChatbotMessageContent({
  messageId,
  children,
  className = "",
}: ChatbotMessageContentProps) {
  const { messages } = useChatbotContext();

  const message = messages.find((item) => item.id === messageId);

  if (!message) return null;

  return (
    <>
      {children ??
        message.parts.map((part, index) => {
          if (part.type !== "text") return null;

          const content = (
            <div
              key={`${message.id}-${index}`}
              className={`${styles.markdownWrapper} ${className}`.trim()}
            >
              {message.role === "user" ? (
                <span>{part.text}</span>
              ) : (
                <Markdown>{part.text}</Markdown>
              )}
            </div>
          );

          return content;
        })}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Loading                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotLoadingProps {
  children?: ReactNode;
  text?: string;
  className?: string;
}

export function ChatbotLoading({
  children,
  text = "Thinking",
  className = "",
}: ChatbotLoadingProps) {
  const { isLoading } = useChatbotContext();

  if (!isLoading) return null;

  return (
    <div className={`${styles.loadingBubble} ${className}`.trim()}>
      {children ?? (
        <>
          {text}
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Input                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotInputProps {
  children?: ReactNode;
  placeholder?: string;
  sendIcon?: ReactNode;
  className?: string;
}

export function ChatbotInput({
  children,
  placeholder = "Ask a question...",
  sendIcon,
  className = "",
}: ChatbotInputProps) {
  const { input, setInput, handleSubmit, isLoading } = useChatbotContext();

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.inputForm} ${className}`.trim()}
    >
      {children ?? (
        <>
          <input
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder={placeholder}
            className={styles.inputField}
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
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </>
      )}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Field                                   */
/* -------------------------------------------------------------------------- */

export interface ChatbotFieldProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function ChatbotField({
  placeholder = "Ask a question...",
  className = "",
  autoFocus = true,
}: ChatbotFieldProps) {
  const { input, setInput } = useChatbotContext();

  return (
    <input
      value={input}
      onChange={(event) => setInput(event.currentTarget.value)}
      placeholder={placeholder}
      className={`${styles.inputField} ${className}`.trim()}
      autoFocus={autoFocus}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Send                                    */
/* -------------------------------------------------------------------------- */

export interface ChatbotSendProps {
  children?: ReactNode;
  icon?: ReactNode;
  text?: string;
  className?: string;
  ariaLabel?: string;
}

export function ChatbotSend({
  children,
  icon = (
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
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  text = "",
  className = "",
  ariaLabel = "Send message",
}: ChatbotSendProps) {
  const { input, isLoading } = useChatbotContext();

  return (
    <button
      type="submit"
      disabled={isLoading || !input.trim().length}
      className={`${styles.sendButton} ${className} ${text ?? "gap-1.5"}`.trim()}
      aria-label={ariaLabel}
    >
      {children ?? (
        <>
          {icon}
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
