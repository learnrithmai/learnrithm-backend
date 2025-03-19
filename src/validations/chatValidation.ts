import { body, param } from "express-validator";

export const chatRequestValidation = [
  param("chatId").notEmpty().withMessage("Chat ID is required"),
  body("messageContent").notEmpty().withMessage("Message content is required"),
  body("files").optional().isArray().withMessage("Files must be an array"),
];
