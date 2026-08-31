# react-ai-chat

A customizable AI chatbot for React.

Start with a ready-made chatbot, or generate the UI directly into your project and make it completely yours.

[![npm version](https://img.shields.io/npm/v/react-ai-chat)](https://www.npmjs.com/package/react-ai-chat)
[![license](https://img.shields.io/npm/l/react-ai-chat)](https://github.com/M-AhmedSajid/react-ai-chat/blob/master/LICENSE)

[Documentation](https://react-ai-chat-docs.vercel.app/) · [npm](https://www.npmjs.com/package/react-ai-chat) · [GitHub](https://github.com/M-AhmedSajid/react-ai-chat)

## See it in action

[![react-ai-chat demo](https://img.youtube.com/vi/YZPEbH7LYpE/maxresdefault.jpg)](https://youtu.be/YZPEbH7LYpE?si=Qy6sK_aJcBbZJirk)

_See react-ai-chat powering an AI chatbot in a real portfolio._

## Features

- Ready-made `<Chatbot />` component
- Generate fully editable chatbot UI with the CLI
- Keep the generated UI source code inside your project
- Streaming AI responses
- Built on the Vercel AI SDK
- Server-side `createChatRoute()`
- Optional RAG with local embedding indexes
- Multiple embedding providers
- Batched embedding generation
- Provider-specific embedding batch limits
- Sequential batch processing to reduce unnecessary rate-limit pressure
- Light, dark, and automatic theme modes
- Custom theme tokens
- Custom icons and CSS classes
- TypeScript support

## How it works

### Use the ready-made chatbot

Install the package and add:

```tsx
<Chatbot />
```

### Or generate your own UI

Run:

```bash
npx react-ai-chat init
```

The CLI generates the chatbot components inside your project.

You can then change the markup, styling, message layout, icons, and behavior while `react-ai-chat` continues to handle the chatbot state and AI communication.

## Installation

Install the package:

```bash
npm install react-ai-chat
```

You also need an AI SDK provider for the language model you want to use.

For example, with Google:

```bash
npm install @ai-sdk/google
```

## Quick Start

### 1. Create a chat route

Create an API route that uses `createChatRoute()`.

For a Next.js App Router application:

```tsx
import { google } from "@ai-sdk/google";
import { createChatRoute } from "react-ai-chat/server";

export const POST = createChatRoute({
  model: google("gemini-3.5-flash"),
});
```

Save it as:

```text
app/api/chat/route.ts
```

### 2. Add the chatbot

Import the component and stylesheet:

```tsx
import { Chatbot } from "react-ai-chat";
import "react-ai-chat/style.css";

export default function App() {
  return <Chatbot />;
}
```

The chatbot uses `/api/chat` as its default API endpoint.

That's it. You now have a streaming AI chatbot running in your React app.

## Customize the chatbot

The ready-made component supports configuration for text, position, starter prompts, icons, themes, API endpoints, and error handling.

```tsx
import { Chatbot } from "react-ai-chat";
import "react-ai-chat/style.css";

export default function App() {
  return (
    <Chatbot
      title="AI Assistant"
      subtitle="Ask me anything"
      triggerText="Chat"
      placeholder="Ask a question..."
      emptyStateText="How can I help?"
      starterPrompts={[
        "What can you help me with?",
        "Tell me about this project",
      ]}
      starterPromptsLabel="Try asking"
      position="bottom-right"
      themeMode="auto"
      onError={(error) => {
        console.error(error);
      }}
    />
  );
}
```

### Theme

Customize the chatbot with theme tokens:

```tsx
<Chatbot
  theme={{
    primaryColor: "#7c3aed",
    primaryForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#18181b",
    mutedBackground: "#f4f4f5",
    mutedForeground: "#71717a",
    borderColor: "#e4e4e7",
  }}
/>
```

Use `light`, `dark`, or `auto` for `themeMode`.

For the complete customization and theming API, see the [documentation](https://react-ai-chat-docs.vercel.app/).

## Generate your own chatbot

Need complete control over the UI?

Use the CLI to generate the chatbot source code directly inside your application:

```bash
npx react-ai-chat init
```

The generated files belong to your project.

You can change the React structure, message rendering, input behavior, styling, icons, and layout while `react-ai-chat` continues to handle the chatbot state and AI communication.

The CLI generates files similar to:

```text
chatbot/
├── chatbot.tsx
├── chatbot-header.tsx
├── chatbot-messages.tsx
├── chatbot-input.tsx
└── chatbot.css
```

To see all available initialization options:

```bash
npx react-ai-chat init --help
```

See the [Generated Chatbot guide](https://react-ai-chat-docs.vercel.app/docs/guides/generated-chatbot).

## RAG

`react-ai-chat` supports retrieval-augmented generation (RAG) using a local embedding index.

Use RAG when you want your chatbot to answer questions using your own documents or knowledge base.

### Generate an embedding index

Use the `embed` command:

```bash
npx react-ai-chat embed
```

The CLI creates an embedding index from your configured documents.

Embedding requests are processed in batches according to the selected provider's supported batch size. Batches are processed sequentially, so the CLI does not send every chunk to the provider at the same time.

You can inspect the available options with:

```bash
npx react-ai-chat embed --help
```

### Embedding batches

Each embedding provider defines a maximum batch size. The index generator uses that limit when sending chunks to the provider.

For example, a provider may process:

```text
Embedding batch 1/3: chunks 1-32/70
Embedding batch 2/3: chunks 33-64/70
Embedding batch 3/3: chunks 65-70/70
```

Each batch is sent as a single `embedMany()` request.

The supported providers are:

| Provider     | Maximum batch size |
| ------------ | -----------------: |
| OpenAI       |              2,048 |
| Voyage AI    |              1,000 |
| Jina AI      |              2,048 |
| Google       |                250 |
| Cohere       |                 96 |
| Hugging Face |                 32 |

Provider and model limits can vary. You can also configure a smaller embedding batch size when needed.

### Configure RAG

Pass the generated index and an embedding provider to `createChatRoute()`.

For example, with Google:

```tsx
import { google } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";
import { createChatRoute, googleEmbedding } from "react-ai-chat/server";
import embeddings from "@/../chatbot/embeddings.json";

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const provider = googleEmbedding(client, {
  model: embeddings.model,
});

export const POST = createChatRoute({
  model: google("gemini-3.5-flash"),
  rag: {
    index: embeddings,
    provider,
    topK: 3,
  },
});
```

The embedding provider used for retrieval should match the model used to generate the index.

Supported embedding providers:

- Google
- OpenAI
- Voyage AI
- Cohere
- Jina AI
- Hugging Face

See the [RAG guide](https://react-ai-chat-docs.vercel.app/docs/guides/rag) and [Embedding Providers](https://react-ai-chat-docs.vercel.app/docs/api/providers) for setup details.

## CLI

`react-ai-chat` includes a CLI for generating chatbot UI and creating RAG embedding indexes.

### Generate chatbot UI

```bash
npx react-ai-chat init
```

### Create an embedding index

```bash
npx react-ai-chat embed
```

### View CLI options

```bash
npx react-ai-chat --help
```

For detailed CLI options and configuration, see the [CLI documentation](https://react-ai-chat-docs.vercel.app/docs/guides/cli).

## Server API

The server entry point provides `createChatRoute()` and embedding provider helpers.

```tsx
import { createChatRoute, googleEmbedding } from "react-ai-chat/server";
```

The main route helper is:

```tsx
createChatRoute({
  model,
  systemPrompt: "You are a helpful assistant.",
  maxMessages: 10,
  rag: {
    index,
    provider,
    topK: 3,
  },
});
```

Only `model` is required. The other options are optional.

For the complete API reference, see the [API documentation](https://react-ai-chat-docs.vercel.app/docs/api).

## TypeScript

The package includes TypeScript types for chatbot configuration, themes, embedding providers, RAG indexes, and errors.

```tsx
import type {
  ChatbotProps,
  ChatbotTheme,
  EmbeddingIndex,
  EmbeddingProvider,
} from "react-ai-chat";
```

See the [Types API reference](https://react-ai-chat-docs.vercel.app/docs/api/types).

## Requirements

- Node.js 18+
- React 18 or React 19
- An AI SDK-compatible model provider

For server-side usage, store provider API keys in environment variables.

For RAG, configure an embedding provider supported by the package.

## Documentation

[Read the full documentation](https://react-ai-chat-docs.vercel.app/)

Useful guides:

- [Getting Started](https://react-ai-chat-docs.vercel.app/docs)
- [CLI](https://react-ai-chat-docs.vercel.app/docs/guides/cli)
- [RAG](https://react-ai-chat-docs.vercel.app/docs/guides/rag)
- [Customization](https://react-ai-chat-docs.vercel.app/docs/guides/customization)
- [Theming](https://react-ai-chat-docs.vercel.app/docs/guides/theming)
- [Generated Chatbot](https://react-ai-chat-docs.vercel.app/docs/guides/generated-chatbot)
- [API Reference](https://react-ai-chat-docs.vercel.app/docs/api)

## Contributing

Contributions, bug reports, and feature requests are welcome.

If you find a bug or have an idea for the package, open an issue. Pull requests are also welcome.

[Contribute on GitHub](https://github.com/M-AhmedSajid/react-ai-chat)

## License

See the [LICENSE](https://github.com/M-AhmedSajid/react-ai-chat/blob/master/LICENSE) file for license information.

## Support

If `react-ai-chat` is useful to you, you can support its development by becoming a patron.

Your support helps me maintain the package, improve the documentation, and build new features.

[Support me on Patreon](https://www.patreon.com/mahmedsajid)
