import { Request, Response, NextFunction } from "express";
import openai from "@/config/openai/openai";

export const createChatResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userQuery } = req.body; // Array of messages

    const chatResponse = await openai.responses.create({
      model: "gpt-4o-mini",
      input: userQuery,
      max_output_tokens: 100,
    });

    console.log(chatResponse);

    res.status(200).json({ response: chatResponse.output_text });
  } catch (error) {
    next(error);
  }
};
