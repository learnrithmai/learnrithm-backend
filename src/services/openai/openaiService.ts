import OpenAI from "openai";
import { openaiConfig } from "../../config/openai/openaiConfig";
import logger from "../../utils/chalkLogger";

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
    });
  }

  async generateChatResponse(
    userMessage: string,
    context?: string,
    retries = 3,
  ): Promise<string> {
    try {
      const messages = [
        {
          role: "system",
          content:
            "You are a helpful assistant for the Learnrithm platform. Provide concise and accurate responses.",
        },
      ];

      if (context) {
        messages.push({ role: "system", content: `Context: ${context}` });
      }

      messages.push({ role: "user", content: userMessage });

      const response = await this.openai.chat.completions.create({
        model: openaiConfig.model,
        messages: messages as Array<OpenAI.ChatCompletionMessageParam>,
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
      });

      // Log token usage for monitoring
      if (response.usage) {
        logger.info(
          `Tokens: ${response.usage.total_tokens} (Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens})`,
        );
      }

      return (
        response.choices[0].message.content || "I couldn't generate a response."
      );
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (
        retries > 0 &&
        error instanceof Error &&
        (error as { status?: number }).status === 429
      ) {
        const delay = Math.pow(2, 4 - retries) * 1000;
        logger.info(`Rate limited by OpenAI. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateChatResponse(userMessage, context, retries - 1);
      }

      // Improved error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("OpenAI API Error:", errorMessage);
      throw new Error(`Failed to generate chat response: ${errorMessage}`);
    }
  }
}

export default new OpenAIService();
