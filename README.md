# next-ai-chatbot

A TypeScript-first chatbot package for Next.js apps. It provides a client-side chat widget, a server route helper for AI SDK streaming, and a CLI for generating document embeddings from local Markdown and text files.

- Floating chat UI with starter prompts, empty state, and input form
- Streaming responses via the AI SDK route helper
- Optional Retrieval-Augmented Generation (RAG) with embeddings JSON
- CLI indexing for Markdown and text files
- Theme customization with light/dark overrides and CSS variable injection
- Markdown rendering in chat messages
- TypeScript support for the client and server entrypoints

## Demo

[![next-ai-chatbot Demo](https://img.youtube.com/vi/YZPEbH7LYpE/maxresdefault.jpg)](https://www.youtube.com/watch?v=YZPEbH7LYpE)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Compound Components](#compound-components)
- [Basic Chatbot](#basic-chatbot)
- [RAG](#rag)
- [CLI](#cli)
- [Chatbot Component API](#chatbot-component-api)
- [Theme API](#theme-api)
- [createChatRoute()](#createchatroute)
- [Folder Structure](#folder-structure)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [License](#license)

---

## Features

- Floating chatbot widget with a trigger button, header, window, message list, and input form.
- Starter prompts and an empty-state message shown before the first user turn.
- Message rendering with `react-markdown`.
- Theme support through `theme`, `themeMode`, and `classNames` props, with CSS custom properties injected for light and dark variations.
- A server route helper that streams responses from an AI model while optionally retrieving context chunks for RAG.
- A CLI that scans Markdown and text files, chunks them, generates embeddings, and writes an embeddings JSON index.
- Compound component exports on the main `Chatbot` export: `Chatbot.Root`, `Chatbot.Trigger`, `Chatbot.Window`, `Chatbot.Header`, `Chatbot.Messages`, and `Chatbot.Input`.

---

## Installation

Install the package:

```bash
npm install next-ai-chatbot
```

Install the peer dependencies required by the client and server helpers:

```bash
npm install next react react-dom ai @ai-sdk/react react-markdown
```

If you want to use Google models in the examples below, install the Google provider package as well:

```bash
npm install @ai-sdk/google
```

---

## Quick Start

1. Install the package and required peers.
2. Create an API route.
3. Render the chatbot component.
4. Ask a question.

### 1. Create an API route

Create an API route such as `app/api/chat/route.ts` in a Next.js app router project:

```ts
import { createChatRoute } from "next-ai-chatbot/server";
import { google } from "@ai-sdk/google";

export const POST = createChatRoute({
  model: google("gemini-2.0-flash"),
  systemPrompt: "You are a helpful assistant.",
});
```

### 2. Render the component

Create a client component:

```tsx
"use client";

import { Chatbot } from "next-ai-chatbot/client";

export default function ChatWidget() {
  return (
    <Chatbot
      title="Support Assistant"
      subtitle="Ask me anything about the product"
      apiEndpoint="/api/chat"
    />
  );
}
```

### 3. Ask a question

Open the page and use the floating widget. The component will send the message to your route and stream the response back.

---

## Compound Components

The main `Chatbot` export also exposes compound component members attached to the object: `Chatbot.Root`, `Chatbot.Trigger`, `Chatbot.Window`, `Chatbot.Header`, `Chatbot.Messages`, and `Chatbot.Input`.

```tsx
"use client";

import { Chatbot } from "next-ai-chatbot/client";

export default function CustomChatLayout() {
  return (
    <Chatbot.Root apiEndpoint="/api/chat" position="bottom-right">
      <Chatbot.Trigger text="Need help?" />
      <Chatbot.Window>
        <Chatbot.Header
          title="Support Center"
          subtitle="Ask about setup or usage"
        />
        <Chatbot.Messages />
        <Chatbot.Input />
      </Chatbot.Window>
    </Chatbot.Root>
  );
}
```

---

## Basic Chatbot

A basic chatbot needs only a model and a system prompt. This is the minimum setup for a non-RAG assistant.

### API route

```ts
import { createChatRoute } from "next-ai-chatbot/server";
import { google } from "@ai-sdk/google";

export const POST = createChatRoute({
  model: google("gemini-2.0-flash"),
  systemPrompt: "You are a concise support assistant.",
});
```

### Chatbot component

```tsx
"use client";

import { Chatbot } from "next-ai-chatbot/client";

export default function BasicChatbot() {
  return (
    <Chatbot
      title="Ask the Team"
      subtitle="Useful for support and product questions"
      apiEndpoint="/api/chat"
      starterPrompts={[
        "What does this product do?",
        "How do I get started?",
      ]}
    />
  );
}
```

---

## RAG

The package does not include a built-in document store. Instead, you generate an embeddings index from local files and load it into the route at runtime.

### 1. Create a content folder

Create a folder with Markdown or text files:

```text
content/
  overview.md
  pricing.md
```

Example content file:

```md
# Product Overview

This product ships with a chat widget and a CLI for indexing local docs.
```

### 2. Run the CLI

Generate an embeddings file:

```bash
npx next-ai-chatbot index ./content --google --output ./chatbot/embeddings.json
```

The CLI will:

- read files from the input folder,
- load Markdown and text files,
- split them into chunks,
- generate embeddings with the selected provider,
- save the result to the output path.

### 3. Import the generated embeddings

In your route file, load the generated JSON file:

```ts
import { createChatRoute, googleEmbedding } from "next-ai-chatbot/server";
import { google } from "@ai-sdk/google";
import embeddings from "@/chatbot/embeddings.json";

export const POST = createChatRoute({
  model: google("gemini-2.0-flash"),
  systemPrompt: "Answer using the supplied references when possible.",
  rag: {
    embeddings,
    provider: googleEmbedding(),
    topK: 3,
  },
});
```

### 4. Configure `createChatRoute()`

The RAG block is optional. When present, the route extracts the last user message, generates a query embedding, retrieves the strongest matching chunks, and injects them into the system prompt.

---

## CLI

The package ships one CLI command:

```bash
npx next-ai-chatbot index [documentsPath] [options]
```

### What it does

The command loads the provided folder, scans for Markdown and text files, chunks each document, generates embeddings with the selected provider, and writes a JSON file.

### Supported file types

The implementation currently reads files matching this glob pattern:

```text
**/*.{md,txt}
```

### Options

- `--google` uses the built-in Google embedding provider.
- `--openai` is accepted by the CLI wrapper, but the current server entrypoint in this repository exposes the Google provider through `googleEmbedding()`.
- `-o, --output <path>` sets a custom output path.

### Default paths

If you do not pass an explicit input path, the CLI uses `./content`.
If you do not pass `--output` or `-o`, the embeddings file is written to:

```text
./chatbot/embeddings.json
```

### Internal behavior

The CLI calls the same indexing pipeline used by the library:

1. load documents from the input folder,
2. split them into chunks,
3. generate embeddings with the selected provider,
4. save the result as JSON.

---

## Chatbot Component API

The component props come from the exported interface in the package.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| title | `string` | `"Ask AI Assistant"` | Header title. |
| subtitle | `string` | `"Trained on custom project data and experience"` | Header subtitle. |
| triggerText | `string` | `"Ask AI"` | Label shown on the floating trigger button. |
| triggerIcon | `ReactNode` | inline SVG | Custom trigger icon. |
| sendIcon | `ReactNode` | inline SVG | Custom send button icon. |
| closeIcon | `ReactNode` | inline SVG | Custom close button icon. |
| position | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"` | Placement of the floating widget. |
| starterPrompts | `string[]` | three default prompts | Chips shown when the conversation is empty. |
| emptyStateText | `string` | default welcome message | Copy shown in the empty state. |
| placeholder | `string` | `"Ask a question..."` | Input placeholder. |
| starterPromptsLabel | `string` | `"Try asking:"` | Label above the starter prompt chips. |
| apiEndpoint | `string` | `undefined` | API path passed to the AI SDK chat hook. |
| initialOpen | `boolean` | `false` | Whether the window starts open. |
| themeMode | `"auto" \| "light" \| "dark"` | `"auto"` | Forces light or dark mode, or follows the system. |
| classNames | `{ wrapper?: string; trigger?: string; window?: string; header?: string }` | `undefined` | Extra class names for parts of the widget. |
| theme | `ChatbotTheme` | `undefined` | Theme overrides for colors. |
| onError | `(error: Error) => void` | `undefined` | Called when the chat hook reports an error. |

---

## Theme API

The theme object supports flat color tokens and optional light/dark overrides. The component injects CSS custom properties such as `--cb-primary`, `--cb-bg`, and `--cb-border`, and uses `--cb-light-*` / `--cb-dark-*` fallbacks when `light` or `dark` tokens are provided.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| primaryColor | `string` | `undefined` | Accent color for buttons, header, and user bubbles. |
| primaryForeground | `string` | `undefined` | Text color on primary-colored elements. |
| background | `string` | `undefined` | Main chat window background. |
| foreground | `string` | `undefined` | Text color in the chat window. |
| mutedBackground | `string` | `undefined` | Background for bot messages, input, and chips. |
| mutedForeground | `string` | `undefined` | Secondary text color. |
| borderColor | `string` | `undefined` | Border color for inputs and prompt chips. |
| light | `ChatbotThemeTokens` | `undefined` | Optional token overrides for light mode. |
| dark | `ChatbotThemeTokens` | `undefined` | Optional token overrides for dark mode. |

Example:

```tsx
<Chatbot
  apiEndpoint="/api/chat"
  theme={{
    primaryColor: "#2563eb",
    primaryForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#0f172a",
    mutedBackground: "#f8fafc",
    mutedForeground: "#64748b",
    borderColor: "#e2e8f0",
    light: {
      primaryColor: "#2563eb",
      background: "#ffffff",
    },
    dark: {
      primaryColor: "#60a5fa",
      background: "#111827",
    },
  }}
/>
```

---

## createChatRoute()

The server helper returns a Next.js route handler that streams AI responses. It accepts a single options object.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| model | `LanguageModel` | required | The AI model instance passed to the AI SDK. |
| systemPrompt | `string` | `"You are a helpful AI assistant."` | Base instruction for the model. |
| maxMessages | `number` | `6` | How many recent messages are included in the request. |
| rag | `{ embeddings; provider; topK? }` | `undefined` | Optional retrieval configuration. |
| rag.embeddings | `EmbeddedChunk[]` | required when `rag` is used | The embeddings index loaded from JSON. |
| rag.provider | `EmbeddingProvider` | required when `rag` is used | An embedding provider instance, such as `googleEmbedding()`. |
| rag.topK | `number` | `3` | Number of chunks to retrieve for context. |

The current implementation does not expose a `minScore` option; retrieval is controlled by `rag.topK` only.

### Route behavior

When RAG is enabled, the route:

1. finds the last user message,
2. generates a query embedding with the provider,
3. retrieves the top matching chunks,
4. injects them into the system prompt.

---

## Folder Structure

A simple structure for a RAG-powered app looks like this:

```text
app/
  api/chat/route.ts
  page.tsx
content/
  overview.md
  pricing.md
chatbot/
  embeddings.json
```

---

## Examples

### Compound components

Use the attached members on the `Chatbot` export when you want to compose the widget from smaller pieces.

```tsx
<Chatbot.Root apiEndpoint="/api/chat" initialOpen={false}>
  <Chatbot.Trigger text="Open help" />
  <Chatbot.Window>
    <Chatbot.Header title="Help Center" subtitle="Ask anything" />
    <Chatbot.Messages />
    <Chatbot.Input />
  </Chatbot.Window>
</Chatbot.Root>
```

### Portfolio website

Use the widget with a short system prompt and a custom title to present your work.

```tsx
<Chatbot
  title="About Me"
  subtitle="Ask about my work and background"
  apiEndpoint="/api/chat"
/>
```

### Company website

Use a support-oriented prompt with a branded theme.

```tsx
<Chatbot
  title="Support"
  subtitle="Questions about products and onboarding"
  apiEndpoint="/api/chat"
  theme={{ primaryColor: "#2563eb" }}
/>
```

### Documentation site

Pair the widget with a RAG-enabled route so it can answer from docs stored in the repository.

```ts
export const POST = createChatRoute({
  model: google("gemini-2.0-flash"),
  systemPrompt: "Answer using the documentation in the supplied references.",
  rag: {
    embeddings,
    provider: googleEmbedding(),
    topK: 3,
  },
});
```

### SaaS dashboard

Use a compact theme and a custom starter prompt set to make the widget feel native to your product.

```tsx
<Chatbot
  title="Product Assistant"
  subtitle="Helpful answers for your workspace"
  apiEndpoint="/api/chat"
  starterPrompts={[
    "How do I invite teammates?",
    "Where is billing?",
    "How do I export data?",
  ]}
/>
```

---

## Troubleshooting

### Missing API key

The Google embedding provider reads `CHATBOT_EMBEDDING_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`. If neither is set, embedding generation fails.

### Embeddings not found

The route throws an error if the embeddings array is missing, empty, or malformed. Make sure the JSON file exists and contains the expected shape.

### Wrong API route

The client component sends messages to whatever value you pass to `apiEndpoint`. Make sure the route exists and the path matches the file you created.

### No RAG results

If the route runs but returns weak or empty context, check that:

- the embeddings file was generated successfully,
- the `rag.provider` can embed text,
- `rag.topK` is set to a sensible value.

### Dark mode

Use `themeMode="dark"` or `themeMode="light"` if you want to force the widget appearance. The default is `"auto"`.

### CLI errors

The CLI expects a folder path and a supported provider flag. The current package implementation is wired for `--google` in the server entrypoint, while `--openai` is only parsed by the wrapper.

---

## FAQ

### Can I use this without RAG?

Yes. Use `createChatRoute()` with only `model` and `systemPrompt`.

### Does the component render Markdown?

Yes. Messages are rendered with `react-markdown`.

### What file types does the CLI index?

It currently reads `.md` and `.txt` files.

### Where are embeddings saved by default?

To `./chatbot/embeddings.json` unless you pass `-o` or `--output`.

### Is the component themeable?

Yes. Pass a `theme` object or use the `themeMode` prop.

---

## License

This repository is distributed under the MIT License. See [LICENSE](LICENSE) for details.
