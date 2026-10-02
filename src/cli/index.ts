import "dotenv/config";
import { loadDocuments } from "./loader.ts";
import { chunkDocuments } from "./chunker.ts";
import { generateEmbeddings, saveIndex } from "./generate.ts";
import { CreateIndexOptions } from "../types.ts";

export async function createIndex({
  provider,
  documentsPath = "./content",
  outputPath = "./chatbot/embeddings.json",
  embeddingBatchSize,
  embeddingRateLimit,
}: CreateIndexOptions) {
  console.log(`Loading documents from ${documentsPath}...`);

  const documents = await loadDocuments(documentsPath);

  console.log(`Found ${documents.length} document(s).`);

  const chunks = chunkDocuments(documents);

  console.log(`Created ${chunks.length} total chunk(s).\n`);

  console.log(
    `Generating embeddings using ${provider.name} (${provider.model})...`,
  );

  const embeddings = await generateEmbeddings(chunks, provider, {
    embeddingBatchSize,
    embeddingRateLimit,
  });

  console.log("\nSaving index file...");

  await saveIndex(outputPath, embeddings);

  console.log("Indexing complete!");
}

export { initChatbot } from "./init.ts";
export { runEmbedCommand } from "./embed.ts";
