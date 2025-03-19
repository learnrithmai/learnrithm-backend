import { Request, Response, NextFunction } from 'express';
import openaiService from '../../services/openai/openaiService';
import logger from '../../utils/chalkLogger';

export const generateChatResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    const response = await openaiService.generateChatResponse(message, context);
    
    return res.status(200).json({
      success: true,
      data: { response }
    });
  } catch (error) {
    logger.error("Chat generation error:", error as string);
    next(error);
  }
};