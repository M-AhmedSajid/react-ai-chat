import fs from "node:fs/promises";
import path from "node:path";
import type { EmbeddingProviderName } from "./providers.ts";

export interface EmbeddingConfig {
  provider: EmbeddingProviderName;
  model: string;
  dimensions: number;
  fallbackModel?: string;
  documentsPath: string;
  outputPath: string;
}

const CONFIG_PATH = "./chatbot/embedding.config.json";

export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  const absolutePath = path.resolve(CONFIG_PATH);

  try {
    const file = await fs.readFile(absolutePath, "utf-8");

    return JSON.parse(file) as EmbeddingConfig;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function saveEmbeddingConfig(
  config: EmbeddingConfig,
): Promise<void> {
  const absolutePath = path.resolve(CONFIG_PATH);

  await fs.mkdir(path.dirname(absolutePath), {
    recursive: true,
  });

  await fs.writeFile(absolutePath, JSON.stringify(config, null, 2), "utf-8");
}

export function getEmbeddingConfigPath() {
  return CONFIG_PATH;
}
