import express from 'express';
import { handleChatRequest } from '@/controllers/chatController';
import { chatRequestValidation } from '@/validations/chatValidation';

const router = express.Router();

// Define a proper type for Express route handlers
type ExpressHandler = (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
) => Promise<void | express.Response | undefined>;

// Use the specific type instead of generic Function
const asyncHandler = (fn: ExpressHandler) => (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/chat/:chatId', chatRequestValidation, asyncHandler(handleChatRequest));

export default router;