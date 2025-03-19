import express from 'express';
import { handleChatRequest } from '@/controllers/chatController';
import { chatRequestValidation } from '@/validations/chatValidation';

const router = express.Router();

// Async handler wrapper to properly handle promises
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Removed duplicate validation declaration

router.post('/chat/:chatId', chatRequestValidation, asyncHandler(handleChatRequest));

export default router;