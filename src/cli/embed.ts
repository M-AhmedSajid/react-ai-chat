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

export interface EmbedCommandResult {
  primaryProvider: Awaited<ReturnType<typeof createEmbeddingProvider>>;
  fallbackProvider?: Awaited<ReturnType<typeof createEmbeddingProvider>>;
  documentsPath: string;
  outputPath: string;
}

export async function runEmbedCommand(): Promise<EmbedCommandResult> {
  const existingConfig = await getEmbeddingConfig();

  let config: EmbeddingConfig;

  if (existingConfig) {
    console.log("\nExisting embedding configuration found.\n");

    console.log(
      `Provider: ${embeddingProviders[existingConfig.provider].name}`,
    );
    console.log(`Primary model: ${existingConfig.model}`);
    console.log(`Dimensions: ${existingConfig.dimensions}`);

    if (existingConfig.fallbackModel) {
      console.log(`Fallback model: ${existingConfig.fallbackModel}`);
    }

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

  const fallbackProvider = config.fallbackModel
    ? await createEmbeddingProvider(config.provider, config.fallbackModel, {
        dimensions: config.dimensions,
      })
    : undefined;

  return {
    primaryProvider,
    fallbackProvider,
    documentsPath: config.documentsPath,
    outputPath: config.outputPath,
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

  const fallbackModel = await selectFallbackModel(
    provider,
    primaryModel.id,
    dimensions,
  );

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

  if (fallbackModel) {
    console.log(`Fallback model: ${fallbackModel.id}`);
  }

  console.log(`Documents: ${documentsPath}`);
  console.log(`Output: ${outputPath}`);

  return {
    provider,
    model: primaryModel.id,
    dimensions,
    fallbackModel: fallbackModel?.id,
    documentsPath,
    outputPath,
  };
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

async function selectFallbackModel(
  provider: EmbeddingProviderName,
  primaryModelId: string,
  primaryDimensions: number,
): Promise<EmbeddingModel | undefined> {
  const models = await getEmbeddingModels(provider);

  const compatibleModels = models.filter((model) => {
    if (model.id === primaryModelId) {
      return false;
    }

    if (model.supportedDimensions?.length) {
      return model.supportedDimensions.includes(primaryDimensions);
    }

    return model.dimensions === primaryDimensions;
  });

  if (compatibleModels.length === 0) {
    return undefined;
  }

  const useFallback = await confirm({
    message: `Do you want to use a fallback model (${primaryDimensions} dimensions)?`,
    default: false,
  });

  if (!useFallback) {
    return undefined;
  }

  const fallbackId = await select({
    message: "Which fallback model do you want to use?",
    choices: compatibleModels.map((model) => ({
      name: model.name,
      value: model.id,
    })),
  });

  return compatibleModels.find((model) => model.id === fallbackId);
}
