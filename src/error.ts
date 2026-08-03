// src/errors.ts
export class ChatbotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatbotError";
    // Custom formatting for readable console output without full stack dumps
    Object.setPrototypeOf(this, ChatbotError.prototype);
  }
}
