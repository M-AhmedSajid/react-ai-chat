import {
  embeddingProviders,
  type EmbeddingModel,
  type EmbeddingProviderName,
} from "../providers.ts";

export function getEmbeddingModels(
  provider: EmbeddingProviderName,
): EmbeddingModel[] {
  return embeddingProviders[provider].models;
}
