# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/specification.html).

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