import { ChatbotError } from "../error.ts";
import type { EmbeddingRateLimit } from "../types.ts";

interface RateLimitEntry {
  timestamp: number;
  tokens: number;
}

const WINDOW_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class EmbeddingRateLimiter {
  private requests: number[] = [];
  private tokenEntries: RateLimitEntry[] = [];

  constructor(private readonly limit: EmbeddingRateLimit = {}) {
    if (
      limit.requestsPerMinute !== undefined &&
      (!Number.isInteger(limit.requestsPerMinute) ||
        limit.requestsPerMinute <= 0)
    ) {
      throw new ChatbotError(
        "requestsPerMinute must be a positive whole number.",
        "INVALID_REQUEST",
      );
    }

    if (
      limit.tokensPerMinute !== undefined &&
      (!Number.isInteger(limit.tokensPerMinute) || limit.tokensPerMinute <= 0)
    ) {
      throw new ChatbotError(
        "tokensPerMinute must be a positive whole number.",
        "INVALID_REQUEST",
      );
    }
  }

  async wait(tokens: number): Promise<void> {
    while (true) {
      const now = Date.now();

      this.requests = this.requests.filter(
        (timestamp) => now - timestamp < WINDOW_MS,
      );

      this.tokenEntries = this.tokenEntries.filter(
        (entry) => now - entry.timestamp < WINDOW_MS,
      );

      const requestLimit = this.limit.requestsPerMinute;
      const tokenLimit = this.limit.tokensPerMinute;

      if (tokenLimit !== undefined && tokens > tokenLimit) {
        throw new ChatbotError(
          `Embedding batch contains ${tokens} tokens, which exceeds ` +
            `the configured tokensPerMinute limit of ${tokenLimit}. ` +
            `Reduce the batch size or configure a higher limit.`,
          "INVALID_REQUEST",
        );
      }

      const requestsBlocked =
        requestLimit !== undefined && this.requests.length >= requestLimit;

      const tokensUsed = this.tokenEntries.reduce(
        (total, entry) => total + entry.tokens,
        0,
      );

      const tokensBlocked =
        tokenLimit !== undefined && tokensUsed + tokens > tokenLimit;

      if (!requestsBlocked && !tokensBlocked) {
        this.requests.push(now);

        if (tokens > 0) {
          this.tokenEntries.push({
            timestamp: now,
            tokens,
          });
        }

        return;
      }

      let waitMs = 250;

      if (requestsBlocked && this.requests.length > 0) {
        waitMs = Math.max(waitMs, WINDOW_MS - (now - this.requests[0]));
      }

      if (tokensBlocked && this.tokenEntries.length > 0) {
        waitMs = Math.max(
          waitMs,
          WINDOW_MS - (now - this.tokenEntries[0].timestamp),
        );
      }

      await sleep(waitMs);
    }
  }
}
