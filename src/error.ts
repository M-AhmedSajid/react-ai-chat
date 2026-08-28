export type ChatbotErrorCode =
  | "RATE_LIMIT"
  | "AUTHENTICATION"
  | "INVALID_REQUEST"
  | "PROVIDER"
  | "UNKNOWN";

export class ChatbotError extends Error {
  code: ChatbotErrorCode;

  constructor(message: string, code: ChatbotErrorCode = "UNKNOWN") {
    super(message);
    this.name = "ChatbotError";
    this.code = code;

    Object.setPrototypeOf(this, ChatbotError.prototype);
  }
}
