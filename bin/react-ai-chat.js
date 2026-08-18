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

// Allow both:
// npx react-ai-chat index ...
// npx react-ai-chat ...
const cliArgs = args[0] === "index" ? args.slice(1) : args;

function getFlagValue(...flags) {
  for (const flag of flags) {
    const index = cliArgs.indexOf(flag);

    if (
      index !== -1 &&
      cliArgs[index + 1] &&
      !cliArgs[index + 1].startsWith("-")
    ) {
      return cliArgs[index + 1];
    }
  }

  return null;
}

// Output path
const explicitOutput = getFlagValue("--output", "-o");

// Positional args
const positionals = [];

for (let i = 0; i < cliArgs.length; i++) {
  const arg = cliArgs[i];
  const prevArg = cliArgs[i - 1];

  if (arg.startsWith("-")) continue;

  if (["--output", "-o", "--provider"].includes(prevArg)) continue;

  positionals.push(arg);
}

// Defaults
const documentsPath = positionals[0] || "./content";
const outputPath =
  explicitOutput || positionals[1] || "./chatbot/embeddings.json";

// Provider
let providerName = getFlagValue("--provider");

if (args[0] === "init") {
  const jsx = args.includes("--jsx");
  const force = args.includes("--force");

  const pathIndex = args.indexOf("--path");
  const outputPath =
    pathIndex !== -1 && args[pathIndex + 1]
      ? args[pathIndex + 1]
      : "src/components/chatbot";

  const { initChatbot } = await import("../dist/cli/index.mjs");

  initChatbot({
    jsx,
    path: outputPath,
    force,
  });

  process.exit(0);
}

if (!providerName) {
  if (cliArgs.includes("--google")) providerName = "google";
  else if (cliArgs.includes("--openai")) providerName = "openai";
  else if (cliArgs.includes("--voyage")) providerName = "voyage";
  else if (cliArgs.includes("--cohere")) providerName = "cohere";
  else if (cliArgs.includes("--jina")) providerName = "jina";
  else if (cliArgs.includes("--huggingface")) providerName = "huggingface";
}

if (!providerName) {
  console.error(`
Error: Please specify an embedding provider.

Examples:

npx react-ai-chat --google
npx react-ai-chat --openai
npx react-ai-chat --voyage
npx react-ai-chat --cohere
npx react-ai-chat --jina
npx react-ai-chat --huggingface

npx react-ai-chat --provider google
npx react-ai-chat --provider openai
npx react-ai-chat --provider voyage
npx react-ai-chat --provider cohere
npx react-ai-chat --provider jina
npx react-ai-chat --provider huggingface
`);

  process.exit(1);
}

const { createIndex } = await import("../dist/cli/index.mjs");
const providers = await import("../dist/server/index.mjs");

let provider;

switch (providerName) {
  case "google": {
    let GoogleGenAI;

    try {
      ({ GoogleGenAI } = await import("@google/genai"));
    } catch {
      console.error(`
Google provider requires @google/genai.

Install it with:

npm install @google/genai
`);

      process.exit(1);
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      console.error(`
Missing API key.

Set: GOOGLE_GENERATIVE_AI_API_KEY
`);

      process.exit(1);
    }

    const client = new GoogleGenAI({
      apiKey,
    });

    provider = providers.googleEmbedding(client);

    break;
  }

  case "openai": {
    let OpenAI;

    try {
      ({ default: OpenAI } = await import("openai"));
    } catch {
      console.error(`
OpenAI provider requires openai package.

Install it with:

npm install openai
`);

      process.exit(1);
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error(`
Missing API key.

Set: OPENAI_API_KEY
`);

      process.exit(1);
    }

    const client = new OpenAI({
      apiKey,
    });

    provider = providers.openAIEmbedding(client);

    break;
  }

  case "voyage": {
    let VoyageAIClient;

    try {
      ({ VoyageAIClient } = await import("voyageai"));
    } catch {
      console.error(`
Voyage provider requires voyageai.

Install it with:

npm install voyageai
`);

      process.exit(1);
    }

    const apiKey = process.env.VOYAGE_API_KEY;

    if (!apiKey) {
      console.error(`
Missing API key.

Set: VOYAGE_API_KEY
`);

      process.exit(1);
    }

    const client = new VoyageAIClient({
      apiKey,
    });

    provider = providers.voyageEmbedding(client);

    break;
  }

  case "cohere": {
    let CohereClientV2;

    try {
      ({ CohereClientV2 } = await import("cohere-ai"));
    } catch {
      console.error(`
Cohere provider requires cohere-ai.

Install it with:

npm install cohere-ai
`);

      process.exit(1);
    }

    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
      console.error(`
Missing API key.

Set: COHERE_API_KEY
`);

      process.exit(1);
    }

    const client = new CohereClientV2({
      token: apiKey,
    });

    provider = providers.cohereEmbedding(client);

    break;
  }

  case "jina": {
    const apiKey = process.env.JINA_API_KEY;

    if (!apiKey) {
      console.error(`
Missing API key.

Set: JINA_API_KEY
`);

      process.exit(1);
    }

    const client = providers.createJinaClient({
      apiKey,
    });

    provider = providers.jinaEmbedding(client);

    break;
  }

  case "huggingface": {
    let InferenceClient;

    try {
      ({ InferenceClient } = await import("@huggingface/inference"));
    } catch {
      console.error(`
Hugging Face provider requires @huggingface/inference.

Install it with:

npm install @huggingface/inference
`);

      process.exit(1);
    }

    const apiKey = process.env.HF_TOKEN;

    if (!apiKey) {
      console.error(`
Missing API key.

Set: HF_TOKEN
`);

      process.exit(1);
    }

    const client = new InferenceClient(apiKey);

    provider = providers.huggingFaceEmbedding(client);

    break;
  }

  default: {
    console.error(`Unsupported provider "${providerName}".`);
    process.exit(1);
  }
}

await createIndex({
  provider,
  documentsPath,
  outputPath,
});

function showHelp() {
  console.log(`
react-ai-chat

Usage:
  react-ai-chat init [options]
  react-ai-chat --<provider>
  react-ai-chat --provider <provider>

Commands:
  init                 Generate customizable chatbot components

Init options:
  --jsx                Generate JSX instead of TSX
  --path <directory>   Output directory
  --force              Replace an existing generated chatbot

General options:
  --help, -h           Show this help message

Embedding providers:
  --google
  --openai
  --voyage
  --cohere
  --jina
  --huggingface

Provider alternative:
  --provider google
  --provider openai
  --provider voyage
  --provider cohere
  --provider jina
  --provider huggingface
`);
}