import axios, { AxiosError } from "axios";
import { ENV } from "@/validations/envSchema";

// Ensure OPENAI_API_KEY is included in your envSchema.ts
if (!ENV.OPENAI_API_KEY) {
  throw new Error("OpenAI API key not set in environment variables");
}

const openaiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
  },
});

export type OpenAIRole = "user" | "assistant" | "system";

export interface OpenAIMessage {
  role: OpenAIRole;
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

const DEFAULT_OPTIONS: CompletionOptions = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  max_tokens: 2000,
};

export async function getCompletion(
  messages: OpenAIMessage[],
  options: CompletionOptions = {},
): Promise<string> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const response = await openaiClient.post("/chat/completions", {
      ...mergedOptions,
      messages,
    });

    const data = response.data;
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error("No response from OpenAI");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // API responded with non-2xx status
        const statusCode = axiosError.response.status;
        const responseData = axiosError.response.data;
        throw new Error(
          `OpenAI API error (${statusCode}): ${JSON.stringify(responseData)}`,
        );
      } else if (axiosError.request) {
        // Request made but no response received
        throw new Error("OpenAI API request timeout or network error");
      }
    }
    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }
}
