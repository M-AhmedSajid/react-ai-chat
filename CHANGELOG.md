# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/specification.html).

## 2.1.1

### Fixed

- Fixed Chatbot window sizing and padding in mobile
- Fixed Chatbot header to div.

## 2.1.0

### Added

- Added a CLI `init` command for generating customizable chatbot components.
- Added TSX generation by default.
- Added JSX generation with `--jsx`.
- Added custom output directories with `--path`.
- Added `--force` to replace an existing generated chatbot.
- Added CLI help with `--help` and `-h`.
- Added automatic help output when the CLI is run without arguments.
- Added generated chatbot components with separate, editable source files.
- Added generated CSS with customizable chatbot styling.
- Added customizable chatbot header, messages, loading state, input, trigger, starter prompts, and Markdown styling.
- Added support for customizing generated chatbot components without relying on the package's internal component structure.
- Preserved the existing embedding generation commands and provider options.

### Changed

- Improved the chatbot component architecture for deeper customization.
- Improved the CLI to support both chatbot generation and embedding generation.
- Improved generated chatbot styling for desktop and mobile layouts.

### Fixed

- Fixed user and assistant Markdown styling.
- Fixed code block styling inside Markdown messages.
- Fixed mobile chatbot sizing and positioning.

## 2.0.0

### Added

- Added framework agnostic React support for the chatbot client.
- Added support for React 18 and React 19.
- Added support for using the chatbot with Vite, Next.js, and React Router.
- Added a public `style.css` export for framework compatible stylesheet loading.
- Added framework independent server handling through standard Web `Request` and `Response` APIs.
- Added the `react-ai-chat` package name and CLI command.
- Added support for configuring the chatbot through a framework provided HTTP endpoint.

### Changed

- Changed CSS handling from JavaScript injection to a public stylesheet export for better SSR compatibility.
- Updated package exports for ESM and CommonJS client and server builds.
- Updated the CLI name from `next-ai-chatbot` to `react-ai-chat`.
- Updated package metadata, documentation, and internal references for the new package identity.

### Fixed

- Fixed CSS loading during server-side rendering in frameworks that do not support importing CSS from Node.
- Fixed package exports to correctly reference the generated CommonJS `.cjs` files.
- Improved compatibility with React frameworks that use different server and client runtimes.

### Migration

The package was previously published as `next-ai-chatbot`.

Install the new package:

```bash
npm install react-ai-chat
```

Import the chatbot and stylesheet:

```tsx
import { Chatbot } from "react-ai-chat";
import "react-ai-chat/style.css";
```

The server helper remains available through the `/server` export:

```tsx
import { createChatRoute } from "react-ai-chat/server";
```

The old `next-ai-chatbot` package remains available on npm as a deprecated package.

## 1.2.0

### Added

- Added Voyage AI, Cohere, Jina, and Hugging Face embedding provider exports to the server/public API surface.
- Added the public Jina client helper `createJinaClient()` and exposed the `JinaClient` and `CreateJinaClientOptions` types.
- Expanded CLI provider support with `--google`, `--openai`, `--voyage`, `--cohere`, `--jina`, `--huggingface`, and `--provider <name>` selection paths.
- Added provider-specific runtime wiring for the server-side provider factories expected by the CLI and runtime RAG flow.

### Changed

- Updated the CLI to resolve provider selection through direct flags and provider-name resolution instead of only the older Google/OpenAI-style flow.
- Kept the output index workflow aligned with the current `createIndex()` implementation that writes the generated content index to `./chatbot/embeddings.json` by default.

### Fixed

- Improved provider response handling so embedding responses without a usable numeric payload now fail with the package's `ChatbotError` boundary instead of returning malformed/undefined vectors.
- Tightened runtime compatibility checks around the embedding provider and model metadata written to the saved index.

## 1.1.0

### Added

- Added a provider architecture for embeddings with reusable provider factories.
- Added OpenAI embedding support through the public provider exports.
- Added support for provider-specific SDK installation, allowing users to install only the embedding providers they need.
- Improved CLI provider handling for Google and OpenAI selection.

### Changed

- Updated CLI usage to support running commands without explicitly writing `index`.
- Added support for selecting providers through `--provider <name>`.
- Improved CLI provider loading with dynamic SDK imports.
- Improved the embedding generation workflow for multiple providers.

### Fixed

- Fixed route-level error handling around missing or malformed embedding data during RAG retrieval.
- Fixed CLI option parsing for input and output paths.

## 1.0.1

### Added

- Added a documented client-side chatbot widget export with compound component members: `Chatbot.Root`, `Chatbot.Trigger`, `Chatbot.Window`, `Chatbot.Header`, `Chatbot.Messages`, and `Chatbot.Input`.
- Added support for `themeMode`, `classNames`, and `theme` overrides in the client component props.
- Added theme token support for flat values plus explicit `light` and `dark` overrides.
- Added Markdown rendering for chat messages through `react-markdown`.
- Added optional RAG context retrieval support in `createChatRoute()` via `rag.embeddings`, `rag.provider`, and `rag.topK`.
- Added a CLI indexing workflow for Markdown and text files that writes an embeddings JSON index.

### Changed

- Updated the client component to inject CSS custom properties such as `--cb-primary`, `--cb-bg`, and `--cb-border`, with `--cb-light-*` and `--cb-dark-*` fallbacks for theme overrides.
- Updated the route helper to use the AI SDK streaming APIs and to include recent conversation history up to `maxMessages`.
- Clarified the CLI behavior for default input and output paths: `./content` and `./chatbot/embeddings.json` unless explicitly overridden.

### Deprecated

- None.

### Removed

- None.

### Fixed

- Fixed theme fallback handling so light and dark overrides are applied even when shared token values are not provided.
- Fixed error handling for missing, empty, or malformed embeddings data in the RAG retrieval flow.
- Fixed CLI option parsing so `--output` / `-o` and the positional input path are resolved consistently.

## 1.0.0

- Added the initial chatbot component.
- Added the `createChatRoute` helper.
- Added the initial RAG indexing CLI.
