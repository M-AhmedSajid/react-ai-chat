import "dotenv/config";
import { loadDocuments } from "./loader.ts";
import { chunkDocuments } from "./chunker.ts";
import { generateEmbeddings, saveIndex } from "./generate.ts";
import { CreateIndexOptions } from "../types.ts";

export async function createIndex({
  provider,
  fallbackProvider,
  documentsPath = "./content",
  outputPath = "./chatbot/embeddings.json",
}: CreateIndexOptions) {
  console.log(`Loading documents from ${documentsPath}...`);
  const documents = await loadDocuments(documentsPath);
  console.log(`Found ${documents.length} document(s).`);

  const chunks = chunkDocuments(documents);
  console.log(`Created ${chunks.length} total chunk(s).\n`);

  console.log(
    `Generating embeddings using ${provider.name} (${provider.model})...`,
  );

  if (fallbackProvider) {
    console.log(`Fallback model: ${fallbackProvider.model}`);
  }
  const embeddings = await generateEmbeddings(
    chunks,
    provider,
    fallbackProvider,
  );

  console.log("\nSaving index file...");
  await saveIndex(outputPath, embeddings);

  console.log("Indexing complete!");
}

export { initChatbot } from "./init.ts";
export { runEmbedCommand } from "./embed.ts";
