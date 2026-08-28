#!/usr/bin/env node

await import("dotenv/config");

const args = process.argv.slice(2);

if (
  args.length === 0 ||
  args.includes("--help") ||
  args.includes("-h")
) {
  showHelp();
  process.exit(0);
}

const command = args[0];

if (command === "embed") {
  const { runEmbedCommand, createIndex } = await import(
    "../dist/cli/index.mjs"
  );

  const {
    primaryProvider,
    fallbackProvider,
    documentsPath,
    outputPath,
  } = await runEmbedCommand();

  await createIndex({
    provider: primaryProvider,
    fallbackProvider,
    documentsPath,
    outputPath,
  });

  process.exit(0);
}

if (command === "init") {
  const jsx = args.includes("--jsx");
  const force = args.includes("--force");

  const pathIndex = args.indexOf("--path");

  const outputPath =
    pathIndex !== -1 && args[pathIndex + 1]
      ? args[pathIndex + 1]
      : "src/components/chatbot";

  const { initChatbot } = await import(
    "../dist/cli/index.mjs"
  );

  initChatbot({
    jsx,
    path: outputPath,
    force,
  });

  process.exit(0);
}

console.error(`
Unknown command: ${command}

Run:

npx react-ai-chat --help
`);

process.exit(1);

function showHelp() {
  console.log(`
react-ai-chat

Usage:
  react-ai-chat <command>

Commands:
  init                 Generate customizable chatbot components
  embed                Create embeddings from your documents

Init options:
  --jsx                Generate JSX instead of TSX
  --path <directory>   Output directory
  --force              Replace an existing generated chatbot

Examples:
  npx react-ai-chat init
  npx react-ai-chat init --jsx
  npx react-ai-chat init --path src/components/chatbot
  npx react-ai-chat embed

General options:
  --help, -h           Show this help message
`);
}