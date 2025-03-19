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

      return (
        response.choices[0].message.content || "I couldn't generate a response."
      );
    } catch (error) {
      logger.error("OpenAI API Error:", error as string);
      throw new Error("Failed to generate chat response from OpenAI");
    }
  }
}

export default new OpenAIService();
