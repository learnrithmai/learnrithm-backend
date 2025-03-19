import { ENV } from "../../validations/envSchema";

export const openaiConfig = {
  apiKey: ENV.OPENAI_API_KEY,
  model: ENV.OPENAI_MODEL || "gpt-4o",
  temperature: 0.7,
  maxTokens: 500,
};