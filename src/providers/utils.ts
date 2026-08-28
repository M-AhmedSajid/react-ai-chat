import { ChatbotError } from "../error.ts";

function getErrorValue(error: unknown, key: string): unknown {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  return key in error ? (error as Record<string, unknown>)[key] : undefined;
}

export function isRateLimitError(error: unknown): boolean {
  const status = getErrorValue(error, "status");
  const statusCode = getErrorValue(error, "statusCode");

  return status === 429 || statusCode === 429;
}

export function isAuthenticationError(error: unknown): boolean {
  const status = getErrorValue(error, "status");
  const statusCode = getErrorValue(error, "statusCode");

  return status === 401 || statusCode === 401;
}

export function throwProviderError(provider: string, error: unknown): never {
  if (error instanceof ChatbotError) {
    throw error;
  }

  if (isRateLimitError(error)) {
    throw new ChatbotError(
      `${provider} embedding rate limit reached.`,
      "RATE_LIMIT",
    );
  }

  if (isAuthenticationError(error)) {
    throw new ChatbotError(
      `${provider} authentication failed.`,
      "AUTHENTICATION",
    );
  }

  throw new ChatbotError(`${provider} embedding error: ${error}`, "PROVIDER");
}
