import { LanguageModel } from "ai";
import { ReactNode } from "react";

export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<number[]>;
}

export interface Document {
  id: string;
  text: string;
}

export interface Chunk {
  id: string;
  source: string;
  chunk: number;
  text: string;
}

export interface EmbeddedChunk {
  id: string;
  source: string;
  chunk: number;
  text: string;
  embedding: number[];
}

export interface CreateIndexOptions {
  provider: EmbeddingProvider;
  documentsPath?: string;
  outputPath?: string;
}

export interface RetrieveContextOptions {
  question: string;
  embeddings: EmbeddedChunk[];
  embedFn: (text: string) => Promise<number[]>;
  topK?: number;
}

export interface ChatRouteOptions {
  model: LanguageModel;
  systemPrompt?: string;
  maxMessages?: number;
  /** Optional RAG configuration for context retrieval */
  rag?: {
    embeddings: EmbeddedChunk[];
    provider: EmbeddingProvider;
    topK?: number;
  };
}

// Embedding providers
export interface GoogleEmbeddingOptions {
  apiKey?: string;
  model?: string;
}

// Client
export interface ChatbotThemeTokens {
  /** Primary accent color for buttons, header, and user bubbles */
  primaryColor?: string;
  /** Text color on primary elements */
  primaryForeground?: string;
  /** Main background color for the chat window */
  background?: string;
  /** Text color inside the chat window */
  foreground?: string;
  /** Background color for bot messages, input, and chips */
  mutedBackground?: string;
  /** Secondary text color for subtitles and labels */
  mutedForeground?: string;
  /** Border color for inputs and prompt chips */
  borderColor?: string;
}

/**
 * Supports flat color tokens or explicit light/dark overrides.
 */
export type ChatbotTheme = ChatbotThemeTokens & {
  light?: ChatbotThemeTokens;
  dark?: ChatbotThemeTokens;
};

export interface ChatbotProps {
  /** Title displayed in the chatbot header */
  title?: string;
  /** Subtitle displayed under the main header */
  subtitle?: string;
  /** Text shown inside the trigger button when collapsed */
  triggerText?: string;
  /** Custom icon for the floating trigger button */
  triggerIcon?: ReactNode;
  /** Custom icon for the send button */
  sendIcon?: ReactNode;
  /** Custom icon for the header close button */
  closeIcon?: ReactNode;
  /** Position of the chatbot window */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Array of starter prompt strings shown when messages are empty */
  starterPrompts?: string[];
  /** Message displayed above starter prompts */
  emptyStateText?: string;
  /** Input field placeholder text */
  placeholder?: string;
  /** Label above starter prompt chips */
  starterPromptsLabel?: string;
  /** API endpoint passed to useChat */
  apiEndpoint?: string;
  /** Initial state of the widget window */
  initialOpen?: boolean;
  /** Force explicit theme mode or defer to system preferences ("auto") */
  themeMode?: "auto" | "light" | "dark";
  /** Custom class for the wrapper element */
  classNames?: {
    wrapper?: string;
    trigger?: string;
    window?: string;
    header?: string;
  };
  /** Custom theme color overrides */
  theme?: ChatbotTheme;
  onError?: (error: Error) => void;
}
