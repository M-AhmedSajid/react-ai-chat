import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface InitOptions {
  jsx?: boolean;
  path?: string;
  force?: boolean;
}

interface Template {
  filename: string;
  content: string;
}

const templates: Template[] = [
  {
    filename: "chatbot.tsx",
    content: `"use client";

import { ChatbotProvider, useChatbotContext } from "react-ai-chat";
import { ChatbotHeader } from "./chatbot-header";
import { ChatbotMessages } from "./chatbot-messages";
import { ChatbotInput } from "./chatbot-input";
import "./chatbot.css";

interface ChatbotProps {
  apiEndpoint?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialOpen?: boolean;
  themeMode?: "auto" | "light" | "dark";
}

export function Chatbot({
  apiEndpoint = "/api/chat",
  position = "bottom-right",
  initialOpen = false,
  themeMode = "auto",
}: ChatbotProps) {
  return (
    <ChatbotProvider
      apiEndpoint={apiEndpoint}
      position={position}
      initialOpen={initialOpen}
      themeMode={themeMode}
    >
      <ChatbotUI />
    </ChatbotProvider>
  );
}

function ChatbotUI() {
  const {
    isOpen,
    setIsOpen,
    position,
    themeMode,
    themeStyles,
  } = useChatbotContext();

  const positionClass = \`chatbot-\${position}\`;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className={\`chatbot-trigger \${positionClass}\`}
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
        >
          Chat
        </button>
      )}

      {isOpen && (
        <div
          className={\`chatbot \${positionClass}\`}
          style={themeStyles}
          data-theme={themeMode !== "auto" ? themeMode : undefined}
        >
          <ChatbotHeader />
          <ChatbotMessages />
          <ChatbotInput />
        </div>
      )}
    </>
  );
}
`,
  },

  {
    filename: "chatbot-header.tsx",
    content: `import { useChatbotContext } from "react-ai-chat";

export function ChatbotHeader() {
  const { setIsOpen } = useChatbotContext();

  return (
    <header className="chatbot-header">
      <div className="chatbot-header-content">
        <h2>AI Assistant</h2>
        <p>Ask me anything</p>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="chatbot-close"
        aria-label="Close chatbot"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>
  );
}
`,
  },

  {
    filename: "chatbot-messages.tsx",
    content: `import { useChatbotContext } from "react-ai-chat";
import ReactMarkdown from "react-markdown";

const starterPrompts = [
  "What is the main tech stack?",
  "Tell me about key projects.",
  "How can I get started?",
];

export function ChatbotMessages() {
  const {
    messages,
    isLoading,
    handleSubmit,
  } = useChatbotContext();

  return (
    <div className="chatbot-messages">
      {messages.length === 0 && (
        <div className="chatbot-empty">
          <div className="chatbot-empty-content">
            <h3>How can I help?</h3>
            <p>
              Ask me anything to get started.
            </p>
          </div>

          <div className="chatbot-starter-prompts">
            <p className="chatbot-starter-prompts-label">
              Try asking:
            </p>

            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chatbot-prompt"
                onClick={() => handleSubmit(undefined, prompt)}
              >
                <span>{prompt}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chatbot-message-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`chatbot-message chatbot-message-\${message.role}\`}
          >
            {message.parts.map((part, index) => {
              if (part.type !== "text") return null;

              if (message.role === "user") {
                return (
                  <span key={index}>
                    {part.text}
                  </span>
                );
              }

              return (
                <div
                  key={index}
                  className="chatbot-markdown"
                >
                  <ReactMarkdown>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            })}
          </div>
        ))}

        {isLoading && (
          <div className="chatbot-loading" aria-live="polite">
            <span>Thinking</span>

            <span
              className="chatbot-loading-dot"
              aria-hidden="true"
            />
            <span
              className="chatbot-loading-dot"
              aria-hidden="true"
            />
            <span
              className="chatbot-loading-dot"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </div>
  );
}
`,
  },

  {
    filename: "chatbot-input.tsx",
    content: `import { useChatbotContext } from "react-ai-chat";

export function ChatbotInput() {
  const {
    input,
    setInput,
    handleSubmit,
    isLoading,
  } = useChatbotContext();

  return (
    <form
      className="chatbot-input"
      onSubmit={handleSubmit}
    >
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask a question..."
        disabled={isLoading}
        className="chatbot-input-field"
        aria-label="Chat message"
      />

      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="chatbot-send"
        aria-label="Send message"
      >
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
          aria-hidden="true"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
`,
  },

  {
    filename: "chatbot.css",
    content: `/* Base Light Theme Tokens */
.chatbot {
  position: fixed;
  z-index: 30;

  /* Default CSS Fallbacks */
  --cb-primary: var(--cb-light-primary, #18181b);
  --cb-primary-fg: var(--cb-light-primary-fg, #ffffff);
  --cb-bg: var(--cb-light-bg, #ffffff);
  --cb-fg: var(--cb-light-fg, #18181b);
  --cb-muted-bg: var(--cb-light-muted-bg, #f4f4f5);
  --cb-muted-fg: var(--cb-light-muted-fg, #71717a);
  --cb-border: var(--cb-light-border, #e4e4e7);

  /* Chat Window Styling */
  width: calc(100vw - 2rem);
  height: 80vh;
  background-color: var(--cb-bg);
  color: var(--cb-fg);
  border: 1px solid var(--cb-border);
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (min-width: 768px) {
  .chatbot {
    width: 21.875rem;
    height: 31.25rem;
  }
}

/* Explicit Dark Mode */
:global(.dark) .chatbot,
:global([data-theme="dark"]) .chatbot,
.chatbot[data-theme="dark"] {
  --cb-primary: var(--cb-dark-primary, #fafafa);
  --cb-primary-fg: var(--cb-dark-primary-fg, #18181b);
  --cb-bg: var(--cb-dark-bg, #18181b);
  --cb-fg: var(--cb-dark-fg, #fafafa);
  --cb-muted-bg: var(--cb-dark-muted-bg, #27272a);
  --cb-muted-fg: var(--cb-dark-muted-fg, #a1a1aa);
  --cb-border: var(--cb-dark-border, #3f3f46);
}

/* System preference fallback */
@media (prefers-color-scheme: dark) {
  :global(:root:not(.light)) .chatbot:not([data-theme="light"]) {
    --cb-primary: var(--cb-dark-primary, #fafafa);
    --cb-primary-fg: var(--cb-dark-primary-fg, #18181b);
    --cb-bg: var(--cb-dark-bg, #18181b);
    --cb-fg: var(--cb-dark-fg, #fafafa);
    --cb-muted-bg: var(--cb-dark-muted-bg, #27272a);
    --cb-muted-fg: var(--cb-dark-muted-fg, #a1a1aa);
    --cb-border: var(--cb-dark-border, #3f3f46);
  }
}

/* Position Variations (Window & Trigger) */
.chatbot-bottom-right,
.chatbot-trigger-bottom-right {
  bottom: 1.5rem;
  right: 1rem;
}

.chatbot-bottom-left,
.chatbot-trigger-bottom-left {
  bottom: 1.5rem;
  left: 1rem;
}

.chatbot-top-right,
.chatbot-trigger-top-right {
  top: 1.5rem;
  right: 1rem;
}

.chatbot-top-left,
.chatbot-trigger-top-left {
  top: 1.5rem;
  left: 1rem;
}

/* Trigger Button */
.chatbot-trigger {
  position: fixed;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--cb-primary, #18181b);
  color: var(--cb-primary-fg, #ffffff);
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
  cursor: pointer;
}

.chatbot-trigger:hover {
  transform: scale(1.05);
  opacity: 0.95;
}

/* Header */
.chatbot-header {
  background-color: var(--cb-primary);
  color: var(--cb-primary-fg);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chatbot-header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chatbot-header-content h2 {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

.chatbot-header-content p {
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.2;
  margin: 0;
}

.chatbot-close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  line-height: 1;
}

.chatbot-close:hover {
  opacity: 0.8;
}

/* Messages Area */
.chatbot-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.chatbot-message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Empty State */
.chatbot-empty-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chatbot-empty-content h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.chatbot-empty-content p {
  color: var(--cb-muted-fg);
  font-size: 0.75rem;
  line-height: 1.6;
  margin: 0;
}

.chatbot-starter-prompts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.chatbot-starter-prompts-label {
  color: var(--cb-muted-fg);
  font-size: 0.75rem;
  margin: 0;
}

.chatbot-prompt {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--cb-border);
  border-radius: 0.5rem;
  background-color: var(--cb-bg);
  color: var(--cb-fg);
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.chatbot-prompt:hover {
  background-color: var(--cb-muted-bg);
  border-color: var(--cb-primary);
}

.chatbot-prompt span:last-child {
  flex-shrink: 0;
  font-size: 1rem;
}

/* Message Bubbles */
.chatbot-message {
  padding: 0.75rem;
  border-radius: 0.75rem;
  max-width: 85%;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: pre-wrap;
}

.chatbot-message-user {
  background-color: var(--cb-primary);
  color: var(--cb-primary-fg);
  margin-left: auto;
}

.chatbot-message-assistant {
  background-color: var(--cb-muted-bg);
  color: var(--cb-fg);
  margin-right: auto;
}

/* Loading Indicator */
.chatbot-loading {
  background-color: var(--cb-muted-bg);
  color: var(--cb-fg);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-right: auto;
  max-width: 85%;
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
}

.chatbot-loading-dot {
  width: 0.375rem;
  height: 0.375rem;
  background-color: var(--cb-fg);
  border-radius: 9999px;
  margin-bottom: 0.25rem;
  animation: bounce 1.4s infinite ease-in-out both;
}

.chatbot-loading-dot:nth-child(1) {
  animation-delay: -0.3s;
}

.chatbot-loading-dot:nth-child(2) {
  animation-delay: -0.15s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Input Form Section */
.chatbot-input {
  padding: 0.75rem;
  border-top: 1px solid var(--cb-border);
  display: flex;
  gap: 0.5rem;
}

.chatbot-input-field {
  flex: 1;
  font-size: 0.875rem;
  background-color: var(--cb-muted-bg);
  color: var(--cb-fg);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--cb-border);
  outline: none;
}

.chatbot-input-field:focus {
  border-color: var(--cb-primary);
}

.chatbot-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background-color: var(--cb-primary);
  color: var(--cb-primary-fg);
  font-size: 0.875rem;
  font-weight: 500;
  height: 2.5rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.chatbot-send:hover:not(:disabled) {
  opacity: 0.85;
}

.chatbot-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Markdown Rendering */
.chatbot-markdown {
  max-width: 100%;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.chatbot-markdown h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: inherit;
}

.chatbot-markdown h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: inherit;
}

.chatbot-markdown h3 {
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
}

.chatbot-markdown p {
  line-height: 1.5;
  margin: 0.25rem 0;
}

.chatbot-markdown p:first-child {
  margin-top: 0;
}

.chatbot-markdown p:last-child {
  margin-bottom: 0;
}

.chatbot-markdown ul {
  padding-left: 1.25rem;
  list-style-type: disc;
}

.chatbot-markdown ol {
  padding-left: 1.25rem;
  list-style-type: decimal;
}

.chatbot-markdown code {
  font-family: monospace;
  font-size: 0.85em;
  background-color: var(--cb-muted-bg, rgba(0, 0, 0, 0.08));
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

.chatbot-markdown pre {
  background-color: var(--cb-muted-bg, rgba(0, 0, 0, 0.1));
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
}

.chatbot-markdown pre code {
  background: transparent;
  padding: 0;
}
`,
  },
];

const jsxTemplates = templates.map((template) => ({
  ...template,
  filename: template.filename.replace(/\.tsx$/, ".jsx"),
  content: template.content
    .replace(/^"use client";\n\n/, "")
    .replace(/interface ChatbotProps \{[\s\S]*?\}\n\n/, "")
    .replace(
      /function ChatbotUI\(\{ position \}: \{ position: ChatbotProps\["position"\] \}\)/g,
      "function ChatbotUI({ position })",
    )
    .replace(/: ChatbotProps/g, "")
    .replace(
      /: "bottom-right" \| "bottom-left" \| "top-right" \| "top-left"/g,
      "",
    )
    .replace(/: boolean/g, "")
    .replace(/: "auto" \| "light" \| "dark"/g, ""),
}));

export function initChatbot({
  jsx = false,
  path = "src/components/chatbot",
  force = false,
}: InitOptions = {}) {
  const outputDirectory = resolve(process.cwd(), path);
  const selectedTemplates = jsx ? jsxTemplates : templates;

  if (existsSync(outputDirectory)) {
    if (!force) {
      console.error(
        `\nError: ${path} already exists.\n\n` +
          `Use --force to replace the generated chatbot.\n`,
      );

      process.exitCode = 1;
      return;
    }

    rmSync(outputDirectory, {
      recursive: true,
      force: true,
    });
  }

  mkdirSync(outputDirectory, { recursive: true });

  for (const template of selectedTemplates) {
    const filePath = join(outputDirectory, template.filename);

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, template.content, "utf8");

    console.log(`Created ${filePath}`);
  }

  console.log(`
Chatbot components created successfully.

Next steps:

1. Import the component:

   import { Chatbot } from "./components/chatbot/chatbot";

2. Add it to your app:

   <Chatbot />

3. Customize the generated files to fit your design.
`);
}
