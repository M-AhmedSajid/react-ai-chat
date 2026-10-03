import { confirm, input, select } from "@inquirer/prompts";
import {
  embeddingProviders,
  type EmbeddingProviderName,
  type EmbeddingModel,
} from "./providers.ts";
import { ensureDependency } from "./install-dependency.ts";
import { getEmbeddingModels } from "./models/index.ts";
import { createEmbeddingProvider } from "./create-embedding-provider.ts";
import {
  getEmbeddingConfig,
  saveEmbeddingConfig,
  type EmbeddingConfig,
} from "./embedding-config.ts";
import type { EmbeddingRateLimit } from "../types.ts";
import {
  deleteEmbeddingProgress,
  getEmbeddingProgressPath,
  loadEmbeddingProgress,
} from "./generate.ts";

export interface EmbedCommandResult {
  primaryProvider: Awaited<ReturnType<typeof createEmbeddingProvider>>;
  documentsPath: string;
  outputPath: string;
  embeddingBatchSize?: number;
  embeddingRateLimit?: EmbeddingRateLimit;
  progressPath: string;
}

export async function runEmbedCommand(): Promise<EmbedCommandResult> {
  const progressPath = getEmbeddingProgressPath();
  const existingProgress = await loadEmbeddingProgress(progressPath);

  let continueExistingRun = false;

  if (existingProgress) {
    const completed = existingProgress.chunks.length;

    continueExistingRun = await confirm({
      message: `An incomplete embedding run was found (${completed} chunk${
        completed === 1 ? "" : "s"
      } already embedded). Continue from where it stopped?`,
      default: true,
    });

    if (!continueExistingRun) {
      await deleteEmbeddingProgress(progressPath);
    }
  }

  const existingConfig = await getEmbeddingConfig();

  let config: EmbeddingConfig;
  let embeddingBatchSize: number | undefined;
  let embeddingRateLimit: EmbeddingRateLimit | undefined;

  if (continueExistingRun) {
    if (!existingConfig) {
      throw new Error(
        "An incomplete embedding run was found, but the embedding configuration is missing. " +
          "The run cannot be resumed safely.",
      );
    }

    config = existingConfig;

    if (
      config.provider !== existingProgress!.provider ||
      config.model !== existingProgress!.model ||
      config.dimensions !== existingProgress!.dimensions
    ) {
      throw new Error(
        "The saved embedding configuration does not match the incomplete embedding run.",
      );
    }

    console.log("\nContinuing the incomplete embedding run.\n");

    console.log(`Provider: ${embeddingProviders[config.provider].name}`);
    console.log(`Primary model: ${config.model}`);
    console.log(`Dimensions: ${config.dimensions}`);
    console.log(`Documents: ${config.documentsPath}`);
    console.log(`Output: ${config.outputPath}`);
  } else if (existingConfig) {
    console.log("\nExisting embedding configuration found.\n");

    console.log(
      `Provider: ${embeddingProviders[existingConfig.provider].name}`,
    );
    console.log(`Primary model: ${existingConfig.model}`);
    console.log(`Dimensions: ${existingConfig.dimensions}`);
    console.log(`Documents: ${existingConfig.documentsPath}`);
    console.log(`Output: ${existingConfig.outputPath}`);

    const action = await select({
      message: "What would you like to do?",
      choices: [
        {
          name: "Use existing settings",
          value: "existing",
        },
        {
          name: "Configure again",
          value: "configure",
        },
      ],
    });

    if (action === "existing") {
      config = existingConfig;
    } else {
      config = await configureEmbedding();
      await saveEmbeddingConfig(config);
    }
  } else {
    config = await configureEmbedding();
    await saveEmbeddingConfig(config);
  }

  const selectedProvider = embeddingProviders[config.provider];

  if (selectedProvider.packageName) {
    ensureDependency(selectedProvider.packageName);
  }

  const primaryProvider = await createEmbeddingProvider(
    config.provider,
    config.model,
    {
      dimensions: config.dimensions,
    },
  );

  embeddingBatchSize = await selectEmbeddingBatchSize(primaryProvider);

  embeddingRateLimit = await selectEmbeddingRateLimit();

  return {
    primaryProvider,
    documentsPath: config.documentsPath,
    outputPath: config.outputPath,
    embeddingBatchSize,
    embeddingRateLimit,
    progressPath,
  };
}

async function configureEmbedding(): Promise<EmbeddingConfig> {
  const provider = await select<EmbeddingProviderName>({
    message: "Which embedding provider do you want to use?",
    choices: Object.entries(embeddingProviders).map(([value, provider]) => ({
      name: provider.name,
      value: value as EmbeddingProviderName,
    })),
  });

  const selectedProvider = embeddingProviders[provider];

  if (selectedProvider.packageName) {
    ensureDependency(selectedProvider.packageName);
  }

  const primaryModel = await selectPrimaryModel(provider);

  const dimensions = await selectDimensions(primaryModel);

  const documentsPath = await input({
    message: "Where are your documents located?",
    default: "./content",
    validate(value) {
      return value.trim().length > 0 || "Please enter a documents path.";
    },
  });

  const outputPath = await input({
    message: "Where should the embeddings be saved?",
    default: "./chatbot/embeddings.json",
    validate(value) {
      return value.trim().length > 0 || "Please enter an output path.";
    },
  });

  console.log(`\nProvider: ${selectedProvider.name}`);
  console.log(`Primary model: ${primaryModel.id}`);
  console.log(`Dimensions: ${dimensions}`);
  console.log(`Documents: ${documentsPath}`);
  console.log(`Output: ${outputPath}`);

  return {
    provider,
    model: primaryModel.id,
    dimensions,
    documentsPath,
    outputPath,
  };
}

async function selectEmbeddingBatchSize(
  provider: Awaited<ReturnType<typeof createEmbeddingProvider>>,
): Promise<number | undefined> {
  const maxBatchSize = provider.maxBatchSize;

  const useCustomBatchSize = await confirm({
    message: `Do you want to use a custom embedding batch size? (Provider maximum: ${maxBatchSize})`,
    default: false,
  });

  if (!useCustomBatchSize) {
    return undefined;
  }

  return input({
    message: `Embedding batch size (1-${maxBatchSize}):`,
    default: String(Math.min(10, maxBatchSize)),
    validate(value) {
      const parsed = Number(value);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        return "Please enter a positive whole number.";
      }

      if (parsed > maxBatchSize) {
        return `Batch size cannot exceed the provider maximum of ${maxBatchSize}.`;
      }

      return true;
    },
    transformer(value) {
      return value;
    },
  }).then(Number);
}

async function selectEmbeddingRateLimit(): Promise<
  EmbeddingRateLimit | undefined
> {
  const configureRateLimit = await confirm({
    message: "Do you want to configure client-side embedding rate limits?",
    default: false,
  });

  if (!configureRateLimit) {
    return undefined;
  }

  const requestsPerMinute = await input({
    message: "Requests per minute (leave empty to skip):",
    default: "",
    validate(value) {
      if (!value.trim()) {
        return true;
      }

      const parsed = Number(value);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        return "Please enter a positive whole number or leave it empty.";
      }

      return true;
    },
  });

  const tokensPerMinute = await input({
    message: "Tokens per minute (leave empty to skip):",
    default: "",
    validate(value) {
      if (!value.trim()) {
        return true;
      }

      const parsed = Number(value);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        return "Please enter a positive whole number or leave it empty.";
      }

      return true;
    },
  });

  const rateLimit: EmbeddingRateLimit = {};

  if (requestsPerMinute.trim()) {
    rateLimit.requestsPerMinute = Number(requestsPerMinute);
  }

  if (tokensPerMinute.trim()) {
    rateLimit.tokensPerMinute = Number(tokensPerMinute);
  }

  return Object.keys(rateLimit).length > 0 ? rateLimit : undefined;
}

async function selectPrimaryModel(
  provider: EmbeddingProviderName,
): Promise<EmbeddingModel> {
  const models = await getEmbeddingModels(provider);

  if (models.length === 0) {
    throw new Error(
      `No embedding models are configured for ${embeddingProviders[provider].name}.`,
    );
  }

  const modelId = await select({
    message: "Which embedding model do you want to use?",
    choices: models.map((model) => ({
      name: model.name,
      value: model.id,
    })),
  });

  const model = models.find((item) => item.id === modelId);

  if (!model) {
    throw new Error(`Unable to find selected model "${modelId}".`);
  }

  return model;
}

async function selectDimensions(model: EmbeddingModel): Promise<number> {
  const dimensions = model.supportedDimensions;

  if (!dimensions || dimensions.length === 0) {
    return model.dimensions;
  }

  if (dimensions.length === 1) {
    return dimensions[0];
  }

  return select({
    message: `Which embedding dimension do you want to use for ${model.name}?`,
    choices: dimensions.map((dimension) => ({
      name: `${dimension} dimensions`,
      value: dimension,
    })),
  });
}
