import { v4 as uuid } from "uuid";
import { Request, Response, NextFunction } from "express";
import { getCompletion } from "../services/ai/openaiService";
import { Message } from "@/types/chat.types";
import log from "@/utils/chalkLogger"; // Import your logger

const messageStore = new Map<string, Message[]>();

export async function handleChatRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { chatId } = req.params;
    const { messageContent, files } = req.body;

    log.info(`Chat request received for chatId: ${chatId}`);
    log.info(`Message content: ${messageContent}`);
    log.info(`Files: ${JSON.stringify(files)}`);

    // Validate input (assuming validation middleware handles this, but adding a check)
    if (!messageContent || typeof messageContent !== "string") {
      log.info("Message content is missing or not a string");
      return res
        .status(400)
        .json({ error: "Message content is required and must be a string" });
    }

    // Retrieve or initialize message history for the chat
    let messages = messageStore.get(chatId);
    if (!messages) {
      log.info(`No existing chat found for chatId: ${chatId}, creating new`);
      messages = [];
      messageStore.set(chatId, messages);
    }

    // Add user message to history
    // Define an interface for file information
    interface FileInfo {
      id: string;
      name: string;
      size: number;
      type: string;
    }

    const userMessage: Message = {
      id: uuid(),
      content: messageContent,
      role: "user" as const,
      timestamp: new Date(),
      files: files
        ? files.map(
            (file: FileInfo): FileInfo => ({
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
            }),
          )
        : undefined,
      chatId,
    };
    messages.push(userMessage);

    // Prepare messages for OpenAI, handling file attachments by mentioning them in content
    const openAIMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        msg.files && msg.files.length > 0
          ? `${msg.content} Attached files: ${msg.files.map((f) => f.name).join(", ")}`
          : msg.content,
    }));

    // Get AI response
    try {
      log.info("Calling OpenAI API...");
      const aiResponseContent = await getCompletion(openAIMessages);
      log.info(`OpenAI response: ${aiResponseContent}`);

      // Add AI message to history
      const aiMessage: Message = {
        id: uuid(),
        content: aiResponseContent,
        role: "assistant",
        timestamp: new Date(),
        chatId,
      };
      messages.push(aiMessage);

      // Return both user and AI messages to the front-end for state update
      res.json({
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          role: userMessage.role,
          timestamp: userMessage.timestamp,
          files: userMessage.files,
          chatId: userMessage.chatId,
        },
        aiMessage: {
          id: aiMessage.id,
          content: aiMessage.content,
          role: aiMessage.role,
          timestamp: aiMessage.timestamp,
          chatId: aiMessage.chatId,
        },
      });
    } catch (openaiError) {
      log.error(`Error calling OpenAI: ${openaiError}`);
      return res.status(500).json({ error: "Error communicating with OpenAI" });
    }
  } catch (error) {
    log.error(`Error in handleChatRequest: ${error}`);
    next(error); // Pass to error handling middleware
  }
}
