export interface EmbeddingModel {
  id: string;
  name: string;
  dimensions: number;
  supportedDimensions?: number[];
  description?: string;
}

export interface EmbeddingProviderConfig {
  name: string;
  packageName: string | null;
  models: EmbeddingModel[];
}

export const embeddingProviders = {
  google: {
    name: "Google",
    packageName: "@google/genai",
    models: [
      {
        id: "gemini-embedding-2",
        name: "Gemini Embedding 2",
        dimensions: 3072,
        supportedDimensions: [768, 1536, 3072],
        description: "Latest multimodal embedding model from Google.",
      },
      {
        id: "gemini-embedding-2-preview",
        name: "Gemini Embedding 2 Preview",
        dimensions: 3072,
        supportedDimensions: [768, 1536, 3072],
        description: "Preview version of Gemini Embedding 2.",
      },
      {
        id: "gemini-embedding-001",
        name: "Gemini Embedding 001",
        dimensions: 3072,
        supportedDimensions: [768, 1536, 3072],
        description:
          "Text embedding model optimized for semantic search and RAG.",
      },
      {
        id: "text-embedding-004",
        name: "Text Embedding 004",
        dimensions: 768,
        description: "Standard Google text embedding model.",
      },
    ],
  },

  openai: {
    name: "OpenAI",
    packageName: "openai",
    models: [
      {
        id: "text-embedding-3-small",
        name: "Text Embedding 3 Small",
        dimensions: 1536,
        description:
          "Small and cost-efficient general-purpose embedding model.",
      },
      {
        id: "text-embedding-3-large",
        name: "Text Embedding 3 Large",
        dimensions: 3072,
        description:
          "Higher-quality embedding model for demanding retrieval tasks.",
      },
      {
        id: "text-embedding-ada-002",
        name: "Text Embedding Ada 002",
        dimensions: 1536,
        description: "Legacy OpenAI embedding model.",
      },
    ],
  },

  voyage: {
    name: "Voyage AI",
    packageName: "voyageai",
    models: [
      {
        id: "voyage-4-large",
        name: "Voyage 4 Large",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "High-quality general-purpose and multilingual retrieval.",
      },
      {
        id: "voyage-4",
        name: "Voyage 4",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "General-purpose and multilingual embedding model.",
      },
      {
        id: "voyage-4-lite",
        name: "Voyage 4 Lite",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Lower-cost and lower-latency Voyage 4 model.",
      },
      {
        id: "voyage-code-4",
        name: "Voyage Code 4",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Embedding model optimized for code retrieval.",
      },
      {
        id: "voyage-4-nano",
        name: "Voyage 4 Nano",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Open-weight Voyage 4 embedding model.",
      },
      {
        id: "voyage-3.5",
        name: "Voyage 3.5",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Previous-generation general-purpose embedding model.",
      },
      {
        id: "voyage-3.5-lite",
        name: "Voyage 3.5 Lite",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Fast and cost-efficient Voyage 3.5 model.",
      },
      {
        id: "voyage-3-large",
        name: "Voyage 3 Large",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Previous-generation general-purpose embedding model.",
      },
      {
        id: "voyage-code-3",
        name: "Voyage Code 3",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Previous-generation code embedding model.",
      },
      {
        id: "voyage-code-2",
        name: "Voyage Code 2",
        dimensions: 1536,
        description: "Legacy code embedding model.",
      },
      {
        id: "voyage-finance-2",
        name: "Voyage Finance 2",
        dimensions: 1024,
        description: "Embedding model optimized for financial retrieval.",
      },
      {
        id: "voyage-law-2",
        name: "Voyage Law 2",
        dimensions: 1024,
        description: "Embedding model optimized for legal retrieval.",
      },
      {
        id: "voyage-multimodal-3.5",
        name: "Voyage Multimodal 3.5",
        dimensions: 1024,
        supportedDimensions: [256, 512, 1024, 2048],
        description: "Multimodal embedding model for text and visual content.",
      },
    ],
  },

  cohere: {
    name: "Cohere",
    packageName: "cohere-ai",
    models: [
      {
        id: "embed-v4.0",
        name: "Embed v4.0",
        dimensions: 1536,
        supportedDimensions: [256, 512, 1024, 1536],
        description:
          "Multimodal embedding model with flexible output dimensions.",
      },
      {
        id: "embed-english-v3.0",
        name: "Embed English v3.0",
        dimensions: 1024,
        description: "English embedding model.",
      },
      {
        id: "embed-english-light-v3.0",
        name: "Embed English Light v3.0",
        dimensions: 384,
        description: "Smaller and faster English embedding model.",
      },
      {
        id: "embed-multilingual-v3.0",
        name: "Embed Multilingual v3.0",
        dimensions: 1024,
        description: "Multilingual embedding model.",
      },
      {
        id: "embed-multilingual-light-v3.0",
        name: "Embed Multilingual Light v3.0",
        dimensions: 384,
        description: "Smaller and faster multilingual embedding model.",
      },
    ],
  },

  jina: {
    name: "Jina AI",
    packageName: "@huggingface/inference",
    models: [
      {
        id: "jina-embeddings-v5-text-small",
        name: "Jina Embeddings v5 Text Small",
        dimensions: 1024,
        supportedDimensions: [32, 64, 128, 256, 512, 768, 1024],
        description:
          "Multilingual text embedding model optimized for retrieval.",
      },
      {
        id: "jina-embeddings-v5-text-nano",
        name: "Jina Embeddings v5 Text Nano",
        dimensions: 768,
        supportedDimensions: [32, 64, 128, 256, 512, 768],
        description: "Small multilingual text embedding model.",
      },
      {
        id: "jina-embeddings-v4",
        name: "Jina Embeddings v4",
        dimensions: 2048,
        supportedDimensions: [128, 256, 512, 1024, 2048],
        description:
          "Multimodal embedding model for text and visual documents.",
      },
      {
        id: "jina-embeddings-v3",
        name: "Jina Embeddings v3",
        dimensions: 1024,
        supportedDimensions: [32, 64, 128, 256, 512, 768, 1024],
        description:
          "Multilingual text embedding model with task-specific adapters.",
      },
    ],
  },

  huggingface: {
    name: "Hugging Face",
    packageName: "@huggingface/inference",
    models: [
      {
        id: "BAAI/bge-small-en-v1.5",
        name: "BGE Small English v1.5",
        dimensions: 384,
        description: "Small English embedding model.",
      },
      {
        id: "BAAI/bge-base-en-v1.5",
        name: "BGE Base English v1.5",
        dimensions: 768,
        description: "General-purpose English embedding model.",
      },
      {
        id: "BAAI/bge-large-en-v1.5",
        name: "BGE Large English v1.5",
        dimensions: 1024,
        description: "Large English embedding model.",
      },
      {
        id: "BAAI/bge-m3",
        name: "BGE M3",
        dimensions: 1024,
        description: "Multilingual embedding model for retrieval.",
      },
      {
        id: "Qwen/Qwen3-Embedding-0.6B",
        name: "Qwen3 Embedding 0.6B",
        dimensions: 1024,
        supportedDimensions: [32, 64, 128, 256, 512, 768, 1024],
        description: "Multilingual embedding model with flexible dimensions.",
      },
      {
        id: "Qwen/Qwen3-Embedding-4B",
        name: "Qwen3 Embedding 4B",
        dimensions: 2560,
        supportedDimensions: [
          32, 64, 128, 256, 512, 768, 1024, 1536, 2048, 2560,
        ],
        description: "High-quality multilingual embedding model.",
      },
      {
        id: "Qwen/Qwen3-Embedding-8B",
        name: "Qwen3 Embedding 8B",
        dimensions: 4096,
        supportedDimensions: [
          32, 64, 128, 256, 512, 768, 1024, 1536, 2048, 2560, 3072, 4096,
        ],
        description: "Large multilingual embedding model.",
      },
    ],
  },
} satisfies Record<string, EmbeddingProviderConfig>;

export type EmbeddingProviderName = keyof typeof embeddingProviders;
