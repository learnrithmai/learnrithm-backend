import { v4 as uuid } from "uuid";
import { Request, Response, NextFunction } from "express";
import { getCompletion } from "../services/ai/openaiService";
import { Message } from "@/types/chat.types";

const messageStore = new Map<string, Message[]>();

export async function handleChatRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { chatId } = req.params;
    const { messageContent, files } = req.body;

    // Validate input (assuming validation middleware handles this, but adding a check)
    if (!messageContent || typeof messageContent !== "string") {
      return res
        .status(400)
        .json({ error: "Message content is required and must be a string" });
    }

    // Retrieve or initialize message history for the chat
    let messages = messageStore.get(chatId);
    if (!messages) {
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
    const aiResponseContent = await getCompletion(openAIMessages);

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
  } catch (error) {
    next(error); // Pass to error handling middleware
  }
}
