# react-ai-chat

A React AI chatbot with streaming responses, optional RAG, and a CLI that generates a fully editable chatbot UI.

The package handles the chatbot logic. The CLI can generate the UI directly into your project so you can change the markup, styling, and behavior without being limited by a component API.

## Features

- React chatbot with streaming responses
- Works with React 18 and React 19
- Built on the Vercel AI SDK
- Optional RAG with embeddings
- Multiple embedding providers
- Custom API endpoint
- Light, dark, and system themes
- Custom theme tokens
- Configurable chatbot position
- Markdown rendering for assistant messages
- Starter prompts
- Custom trigger, send, and close icons
- Customizable chatbot text
- CLI-generated chatbot UI
- Generated UI is fully owned by your project
- TypeScript support

## Installation

```bash
npm install react-ai-chat
```

You will also need React and a model/provider supported by the AI SDK.

## Quick Start

### 1. Create the chat route

The server API is framework-agnostic and returns a standard `POST` handler.

For example, with a Next.js App Router:

```ts
// app/api/chat/route.ts

import { createChatRoute } from "react-ai-chat/server";
import { google } from "@ai-sdk/google";

export const POST = createChatRoute({
  model: google("gemini-3.5-flash"),
});
```

### 2. Add the chatbot

```tsx
import { Chatbot } from "react-ai-chat";
import "react-ai-chat/style.css";

export default function Page() {
  return <Chatbot />;
}
```

The default chatbot uses `/api/chat` as its API endpoint.

That's enough to get the packaged chatbot running.

---

# Customize the Chatbot

There are two ways to use the client.

## Use the ready-made `<Chatbot />`

The packaged component gives you a complete chatbot with configuration options.

```tsx
<Chatbot
  title="AI Assistant"
  subtitle="Ask me anything"
  triggerText="Chat with AI"
  position="bottom-right"
  initialOpen={false}
  themeMode="auto"
  starterPrompts={[
    "What can you help me with?",
    "Tell me about this project",
    "How can I get started?",
  ]}
/>
```

### Available props

```ts
interface ChatbotProps {
  title?: string;
  subtitle?: string;
  triggerText?: string;

  triggerIcon?: ReactNode;
  sendIcon?: ReactNode;
  closeIcon?: ReactNode;

  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";

  starterPrompts?: string[];
  emptyStateText?: string;
  placeholder?: string;
  starterPromptsLabel?: string;

  apiEndpoint?: string;
  initialOpen?: boolean;

  themeMode?: "auto" | "light" | "dark";

  classNames?: {
    wrapper?: string;
    trigger?: string;
    window?: string;
    header?: string;
  };

  theme?: ChatbotTheme;

  onError?: (error: Error) => void;
}
```

## Theme

You can customize the chatbot using theme tokens.

```tsx
<Chatbot
  theme={{
    primaryColor: "#111827",
    primaryForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#111827",
    mutedBackground: "#f3f4f6",
    mutedForeground: "#6b7280",
    borderColor: "#e5e7eb",
  }}
/>
```

Light and dark values can also be configured separately:

```tsx
<Chatbot
  theme={{
    light: {
      primaryColor: "#111827",
      background: "#ffffff",
      foreground: "#111827",
    },
    dark: {
      primaryColor: "#ffffff",
      primaryForeground: "#111827",
      background: "#111827",
      foreground: "#ffffff",
    },
  }}
/>
```

---

# Full UI Customization

If you want complete control over the chatbot UI, use the CLI.

```bash
npx react-ai-chat init
```

The CLI generates the chatbot source directly inside your project.

The generated structure is:

```text
chatbot/
├── chatbot.tsx
├── chatbot-header.tsx
├── chatbot-messages.tsx
├── chatbot-input.tsx
└── chatbot.css
```

The generated files are yours.

You can change the HTML, CSS, icons, text, message layout, starter prompts, input, header, or the entire design.

The chatbot logic remains inside `react-ai-chat`.

For example, the generated components use:

```tsx
import { ChatbotProvider, useChatbotContext } from "react-ai-chat";
```

This lets the generated UI access:

- open/close state
- messages
- input state
- loading state
- message submission
- position
- theme information

The package handles the logic while your project owns the UI.

## CLI options

### Generate the chatbot

```bash
npx react-ai-chat init
```

### Generate JSX instead of TSX

```bash
npx react-ai-chat init --jsx
```

### Choose an output path

```bash
npx react-ai-chat init --path ./components/chatbot
```

### Overwrite existing generated files

```bash
npx react-ai-chat init --force
```

After generation, import the component from your project:

```tsx
import { Chatbot } from "./components/chatbot/chatbot";
```

Then render it:

```tsx
<Chatbot />
```

---

# Using the Chatbot Context

The package exposes the provider and context hook for custom UIs.

```tsx
import { ChatbotProvider, useChatbotContext } from "react-ai-chat";
```

Wrap your UI with the provider:

```tsx
<ChatbotProvider apiEndpoint="/api/chat">
  <YourChatbotUI />
</ChatbotProvider>
```

Then access the chatbot state and actions:

```tsx
function YourChatbotUI() {
  const {
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
  } = useChatbotContext();

  return (
    // Your UI
  );
}
```

This is useful when you want to build a completely different chatbot interface while keeping the package's chat logic.

---

# RAG

`react-ai-chat` includes optional retrieval-augmented generation.

The server route can retrieve relevant chunks from an embedding index before sending the request to the model.

```ts
createChatRoute({
  model,
  rag: {
    index,
    provider,
    topK: 3,
  },
});
```

When RAG is enabled:

1. The latest user question is extracted.
2. The question is embedded using the configured embedding provider.
3. Relevant chunks are retrieved from the embedding index.
4. The retrieved context is added to the system prompt.
5. The model generates a streaming response using that context.

If the answer cannot be found in the retrieved references, the generated system instructions tell the model to say that it does not have enough information instead of guessing.

## Creating an embedding index

The package includes CLI utilities for loading documents, chunking them, generating embeddings, and saving an index.

The default paths are:

```text
./content
./chatbot/embeddings.json
```

```bash
npx react-ai-chat --google
```

---

# Embedding Providers

The package currently supports:

- Google
- OpenAI
- Voyage
- Cohere
- Jina
- Hugging Face

Provider implementations are exported from:

```ts
import {} from // provider exports
"react-ai-chat/server";
```

The exact model is configurable through each provider's options.

---

# Server API

The server entry point is:

```ts
import { createChatRoute } from "react-ai-chat/server";
```

## `createChatRoute`

```ts
createChatRoute({
  model,
  systemPrompt?,
  maxMessages?,
  rag?,
});
```

### `model`

The language model used to generate responses.

```ts
createChatRoute({
  model,
});
```

### `systemPrompt`

Customize the system instructions.

```ts
createChatRoute({
  model,
  systemPrompt: "You are a helpful support assistant.",
});
```

The default is:

```text
You are a helpful AI assistant.
```

### `maxMessages`

Controls how many recent messages are sent to the model.

```ts
createChatRoute({
  model,
  maxMessages: 10,
});
```

The default is `6`.

### `rag`

Optional retrieval configuration.

```ts
createChatRoute({
  model,
  rag: {
    index,
    provider,
    topK: 3,
  },
});
```

---

# API Endpoint

The client defaults to:

```text
/api/chat
```

You can use another endpoint:

```tsx
<Chatbot apiEndpoint="/api/ai" />
```

Or with the generated UI:

```tsx
<Chatbot apiEndpoint="/api/ai" />
```

The endpoint should accept the request format produced by the AI SDK and return the streaming response created by `createChatRoute`.

---

# Styling

The ready-made `<Chatbot />` uses the package stylesheet:

```tsx
import "react-ai-chat/style.css";
```

The CLI-generated chatbot has its own:

```text
chatbot.css
```

You can edit that file directly.

This is the recommended approach when you want full visual control over the generated chatbot.

---

# Error Handling

The client accepts an error callback:

```tsx
<Chatbot
  onError={(error) => {
    console.error(error);
  }}
/>
```

Server-side route errors use the package's `ChatbotError` type.

---

# Package API

The main client entry exports:

```ts
import { Chatbot, ChatbotProvider, useChatbotContext } from "react-ai-chat";
```

The server entry exports:

```ts
import { createChatRoute } from "react-ai-chat/server";
```

It also exports the embedding providers.

The compound chatbot UI components are not part of the public API.

---

# Architecture

The package separates chatbot logic from the UI.

```text
react-ai-chat
│
├── Client
│   ├── Chatbot
│   ├── ChatbotProvider
│   └── useChatbotContext
│
├── Server
│   ├── createChatRoute
│   └── embedding providers
│
└── CLI
    ├── UI generator
    └── RAG index generation
```

The ready-made `Chatbot` provides a complete UI.

The CLI gives you the source code when you need complete control over the UI.

The provider and context keep the chat state, streaming communication, theme information, and submission logic inside the package.

---

# Requirements

- Node.js 18+
- React 18 or React 19

A model provider supported by the Vercel AI SDK is required for the server route.

For RAG, install and configure the embedding provider you want to use.

---

# License

MIT
