# next-ai-chatbot

A complete AI chatbot toolkit for Next.js with RAG, embeddings, and streaming.

next-ai-chatbot gives you the building blocks for adding a polished chatbot experience to a Next.js app without turning your project into a hosted chatbot service. It combines a client-side chatbot UI, a server route helper, a local document indexing CLI, and an embedding provider layer for retrieval-augmented generation (RAG).

The package is currently focused on Next.js, but the core pieces are reusable building blocks for modern React-based AI experiences. It is a practical fit for Next.js developers, portfolio owners, SaaS founders, and anyone learning how AI chat experiences are built around real content.

## Table of contents

- [Demo](#demo)
- [Features](#features)
- [How it works](#how-it-works)
- [Installation](#installation)
- [Quick start](#quick-start)
- [How RAG works internally](#how-rag-works-internally)
- [CLI documentation](#cli-documentation)
- [Providers](#providers)
- [API reference](#api-reference)
- [Why next-ai-chatbot?](#why-next-ai-chatbot)
- [Project ideas](#project-ideas)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Demo

The following video shows the chatbot integrated into a portfolio website:

https://www.youtube.com/watch?v=YZPEbH7LYpE

## Features

- Streaming AI chat responses through the AI SDK
- Next.js route handler integration with a simple server helper
- RAG support for grounding responses in local documents
- Local document indexing from Markdown and text files
- Embedding provider architecture for custom embedding backends
- Google embeddings via the Google GenAI SDK
- OpenAI embeddings via the OpenAI SDK
- AI SDK-compatible model support through the `model` argument
- Custom system prompts
- Context retrieval and context injection for prompts
- A client-side chatbot widget with starter prompts and theme customization options

## How it works

The package follows a straightforward RAG workflow:

Documents
↓
CLI indexing
↓
Embeddings generation
↓
Stored embedding index
↓
Semantic retrieval
↓
Context injection
↓
AI response

In practice, you point the CLI at a folder of Markdown or text files, generate embeddings for those documents, save the embedding index, and then use the route helper to retrieve the most relevant chunks at request time before streaming the answer.

## Installation

Install the package in your app:

```bash
npm install next-ai-chatbot
```

Optional provider SDKs are required for embedding generation:

```bash
npm install @google/genai
```

```bash
npm install openai
```

### Environment variables

The CLI and provider helpers expect the following environment variables when you use the corresponding providers:

- `GOOGLE_GENERATIVE_AI_API_KEY` for Google embeddings
- `OPENAI_API_KEY` for OpenAI embeddings

If you are using the CLI locally, set the relevant variable in your shell before running the command:

```bash
export GOOGLE_GENERATIVE_AI_API_KEY=your-key
```

```bash
export OPENAI_API_KEY=your-key
```

## Quick start

This section walks through the package from the simplest possible setup to a full RAG-enabled chatbot route.

### 1. Simplest chatbot setup

Create a route handler that streams a response with a model instance:

```ts
// app/api/chat/route.ts
import { createChatRoute } from "next-ai-chatbot/server";

export const POST = createChatRoute({
  model: yourModel,
});
```

The example above is the minimal setup. It creates a POST handler that accepts chat messages, converts them into the AI SDK message format, and streams the response back to the client.

### 2. Configuration options for createChatRoute()

The `createChatRoute()` helper accepts the following options:

```ts
createChatRoute({
  model,
  systemPrompt,
  maxMessages,
  rag,
});
```

- `model` (required): an AI SDK-compatible language model instance.
- `systemPrompt` (optional): a custom system prompt. The default value is `You are a helpful AI assistant.`
- `maxMessages` (optional): how many recent messages are included from the conversation history. The default is `6`.
- `rag` (optional): an object with `index`, `provider`, and `topK` for retrieval-augmented generation.

### 3. Add the chatbot UI

The package also exports a client-side chatbot widget:

```tsx
import { Chatbot } from "next-ai-chatbot";

export default function ChatWidget() {
  return (
    <Chatbot
      apiEndpoint="/api/chat"
      title="Ask me anything"
      subtitle="Built with next-ai-chatbot"
    />
  );
}
```

This component is designed to work with your route handler through the `apiEndpoint` prop.

### 4. Complete RAG example

After you create an embeddings index, you can inject retrieved context into the prompt before streaming an answer.

```ts
// app/api/chat/route.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createChatRoute, googleEmbedding } from "next-ai-chatbot/server";
import { GoogleGenAI } from "@google/genai";

const googleClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const provider = googleEmbedding(googleClient);

const index = JSON.parse(
  await readFile(path.join(process.cwd(), "chatbot/embeddings.json"), "utf8"),
);

export const POST = createChatRoute({
  model: yourModel,
  systemPrompt: "You are a helpful assistant for my content library.",
  maxMessages: 8,
  rag: {
    index,
    provider,
    topK: 5,
  },
});
```

### What happens in this RAG flow

- The latest user message is extracted from the conversation.
- The route helper creates an embedding for that message using the configured provider.
- The package compares the query embedding against the stored document embeddings.
- The most relevant chunks are retrieved and formatted into a context block.
- That context is injected into the model prompt before the response is streamed.

## How RAG works internally

This section explains the implementation details of the indexing and retrieval flow that powers the package.

### 1. Document loading

The CLI loads documents from a target directory and only considers Markdown and text files. The loader uses the file path as the document ID and reads the file contents from disk.

The matching file types are:

- `.md`
- `.txt`

Frontmatter is parsed with `gray-matter`, and the trimmed content is used as the document text.

### 2. Chunking

Once documents are loaded, the content is split into chunks. The implementation uses a default chunk size of `1000` characters and an overlap of `200` characters.

Each chunk receives:

- an ID in the form `document-id#chunk-number`
- the source document path
- the chunk number
- the chunk text

This helps preserve context across nearby sections while keeping retrieval focused.

### 3. Embedding generation

Each chunk is sent to the selected embedding provider. The provider returns a numeric vector that represents the text semantics.

The package stores the embedding along with the chunk metadata in a structured index object.

### 4. Embedding storage

The CLI writes the generated index to JSON. The saved index includes:

- the provider name
- the provider model name
- the embedding dimensions
- the list of embedded chunks

The output file is written by default to `./chatbot/embeddings.json` unless you override it with `--output` or `-o`.

### 5. Query embedding

When the chat route receives a request, it extracts the last user message and creates an embedding for that text using the same provider that was used to build the index.

This ensures that the stored chunk vectors and the query vector are compatible.

### 6. Cosine similarity retrieval

Once the query embedding is available, the package compares it against every stored embedding using cosine similarity. The highest-scoring chunks are selected.

The default retrieval size is `3`, but you can change it with `rag.topK`.

### 7. Context injection into the model

The retrieved chunks are formatted into a context block and attached to the system prompt before the model is called. The helper adds instructions that tell the model to rely on those references and to say when it does not have enough information.

That is the core RAG experience: search relevant content, inject the relevant text, and let the model answer from that context.

## CLI documentation

The package ships with a CLI for indexing local documents into an embedding index.

### Command syntax

```bash
npx next-ai-chatbot [path] [--provider <name>] [--output <path>]
```

You can also use the explicit `index` form:

```bash
npx next-ai-chatbot index ./content --google
```

### Supported flags

- `--google` selects the Google embedding provider
- `--openai` selects the OpenAI embedding provider
- `--provider <name>` selects a provider by name
- `--output <path>` or `-o <path>` sets the output file path

### Examples

#### Google provider

```bash
npx next-ai-chatbot ./content --google
```

#### OpenAI provider

```bash
npx next-ai-chatbot ./content --openai
```

#### Explicit provider flag

```bash
npx next-ai-chatbot ./content --provider google
```

### Output file behavior

The CLI writes an embeddings JSON file to disk. By default, the output path is:

```text
./chatbot/embeddings.json
```

You can override it with:

```bash
npx next-ai-chatbot ./content --google --output ./my-index/embeddings.json
```

### Input path behavior

If no positional path is provided, the CLI uses:

```text
./content
```

### Environment variable setup for the CLI

Before running the CLI, make sure the appropriate environment variable is set:

```bash
export GOOGLE_GENERATIVE_AI_API_KEY=your-key
```

or:

```bash
export OPENAI_API_KEY=your-key
```

### What the CLI does internally

The CLI:

1. Loads Markdown and text files from the provided directory.
2. Reads frontmatter and extracts document content.
3. Splits content into chunks.
4. Generates embeddings with the selected provider.
5. Writes the resulting index as JSON.

## Providers

The embedding provider layer is intentionally simple. The package exposes factory helpers that wrap a provider-specific client and return the common embedding interface used by the rest of the package.

### Google embedding provider

#### Installation

```bash
npm install @google/genai
```

#### Required environment variable

```bash
export GOOGLE_GENERATIVE_AI_API_KEY=your-key
```

#### Initialization example

```ts
import { GoogleGenAI } from "@google/genai";
import { googleEmbedding } from "next-ai-chatbot/server";

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const provider = googleEmbedding(client);
```

#### When to use it

Use the Google provider when you want to generate embeddings with the Google GenAI SDK and the corresponding API key is available in your environment.

### OpenAI embedding provider

#### Installation

```bash
npm install openai
```

#### Required environment variable

```bash
export OPENAI_API_KEY=your-key
```

#### Initialization example

```ts
import OpenAI from "openai";
import { openAIEmbedding } from "next-ai-chatbot/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const provider = openAIEmbedding(client);
```

#### When to use it

Use the OpenAI provider when you want to generate embeddings through the OpenAI SDK and have an API key configured.

## API reference

### createChatRoute()

#### Signature

```ts
createChatRoute({
  model,
  systemPrompt?,
  maxMessages?,
  rag?,
})
```

#### Parameters

- `model` (required): an AI SDK-compatible language model instance.
- `systemPrompt` (optional): overrides the default system prompt.
- `maxMessages` (optional): number of recent messages to include from the conversation history. Default: `6`.
- `rag` (optional): configuration for retrieval-augmented generation.

The `rag` object supports:

- `index`: the embedding index JSON object produced by the CLI
- `provider`: the embedding provider instance used to build the index
- `topK` (optional): number of chunks to retrieve. Default: `3`

#### Return value

`createChatRoute()` returns an async handler function that accepts a `Request` and returns a streaming chat response.

#### Example usage

```ts
import { createChatRoute } from "next-ai-chatbot/server";

export const POST = createChatRoute({
  model: yourModel,
  systemPrompt: "You are a helpful assistant.",
  maxMessages: 6,
});
```

### googleEmbedding()

#### Signature

```ts
googleEmbedding(client, options?)
```

#### Parameters

- `client` (required): a Google GenAI client instance with a `models.embedContent()` method.
- `options` (optional): an object with a `model` property.

If `options.model` is not supplied, the implementation uses the default model:

```text
gemini-embedding-001
```

#### Return value

Returns an object that implements the package's embedding provider interface with:

- `name`
- `model`
- `embed(text)`

#### Example usage

```ts
import { GoogleGenAI } from "@google/genai";
import { googleEmbedding } from "next-ai-chatbot/server";

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const provider = googleEmbedding(client, {
  model: "gemini-embedding-001",
});
```

### openAIEmbedding()

#### Signature

```ts
openAIEmbedding(client, options?)
```

#### Parameters

- `client` (required): an OpenAI client instance with an `embeddings.create()` method.
- `options` (optional): an object with a `model` property.

If `options.model` is not supplied, the implementation uses the default model:

```text
text-embedding-3-small
```

#### Return value

Returns an object that implements the package's embedding provider interface with:

- `name`
- `model`
- `embed(text)`

#### Example usage

```ts
import OpenAI from "openai";
import { openAIEmbedding } from "next-ai-chatbot/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const provider = openAIEmbedding(client, {
  model: "text-embedding-3-small",
});
```

## Why next-ai-chatbot?

Building a RAG chatbot from scratch usually means stitching together document loading, chunking, embeddings, retrieval, prompt formatting, and streaming yourself. This package gives you a focused starting point for those pieces without locking you into a hosted service.

Compared with manually wiring everything up, next-ai-chatbot helps you move faster. Compared with hosted chatbot tools, it keeps the retrieval and indexing workflow inside your own project and lets you work with your own content.

It is also helpful if you want to understand the moving parts of a chatbot stack before you move to a larger production system.

## Project ideas

Here are a few realistic ways to use the package:

### Portfolio AI assistant

Add a chatbot to your portfolio website so visitors can ask questions about your projects, experience, and available work.

### Documentation chatbot

Index your product docs, onboarding material, or help center articles and let users ask questions in plain language.

### SaaS support chatbot

Use the package to create a support assistant over internal knowledge articles or customer-facing documentation.

## Troubleshooting

### Missing API key

If the CLI or provider helper fails because of a missing API key, make sure the correct environment variable is set:

- `GOOGLE_GENERATIVE_AI_API_KEY` for Google
- `OPENAI_API_KEY` for OpenAI

### Missing provider package

If you see an error about a missing provider package, install the expected dependency:

```bash
npm install @google/genai
```

or:

```bash
npm install openai
```

### Embedding dimension mismatch

This happens when the index was generated with a provider/model combination that does not match the provider currently used for query embeddings. Make sure the same provider and model are used for both indexing and retrieval.

### Invalid embeddings file

If the embeddings file is missing, empty, or malformed, the route helper will fail during retrieval. Make sure the CLI created a valid JSON file and that the file contains the expected chunk data.

## Contributing

Contributions are welcome.

If you want to improve the package, you can:

- open an issue for bugs or feature ideas
- submit a pull request with a clear explanation of the change
- keep examples and documentation aligned with the current implementation

Because the package is intentionally focused on the features implemented in the source, changes should stay consistent with the current API surface.

## License

This project is licensed under the MIT License.
