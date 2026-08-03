import { defineConfig } from "tsdown";

export default defineConfig([
  // Client Entry (Chatbot Component)
  {
    entry: ["src/client/index.ts"],
    outDir: "dist/client",
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    minify: true,
    deps: {
      neverBundle: ["react", "react-dom", "@ai-sdk/react", "react-markdown"],
    },
    banner: {
      js: '"use client";',
    },
    css: {
      inject: true,
    },
  },
  // Server Entry (createChatRoute, retrieveContext, etc.)
  {
    entry: ["src/server/index.ts"],
    outDir: "dist/server",
    format: ["cjs", "esm"],
    dts: true,
    clean: false,
    minify: true,
    deps: {
      neverBundle: ["ai", "@google/genai", "dotenv"],
    },
  },
  // CLI Entry (runIndexCommand, etc.)
  {
    entry: ["src/cli/index.ts"],
    outDir: "dist/cli",
    format: ["cjs", "esm"],
    dts: true,
    clean: false,
    minify: false,
  },
]);
