import express from "express";
import passport from "passport";
import { body, validationResult } from "express-validator";
import openAIService from "../../../services/openai/openaiService";
import logger from "../../../utils/chalkLogger";

const router = express.Router();

/**
 * @swagger
 * /api/v1/openai/chat:
 *   post:
 *     summary: Generate a response using OpenAI
 *     tags: [OpenAI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's input message
 *               context:
 *                 type: string
 *                 description: Optional context to guide the AI response
 *     responses:
 *       200:
 *         description: Successful response from OpenAI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
// Define interfaces
interface ChatRequestBody {
  message: string;
  context?: string;
}

interface ChatSuccessResponse {
  success: true;
  response: string;
}

interface ChatValidationErrorResponse {
  success: false;
  errors: any[]; // From validation result
}

interface ChatGeneralErrorResponse {
  success: false;
  error: string;
}

type ChatResponse = ChatSuccessResponse | ChatValidationErrorResponse | ChatGeneralErrorResponse;

interface JwtUser {
  id: string;
  email: string;
}

router.post(
  "/chat",
  passport.authenticate("jwt", { session: false }),
  [
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isString()
      .withMessage("Message must be a string")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
    body("context")
      .optional()
      .isString()
      .withMessage("Context must be a string")
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Context cannot exceed 2000 characters"),
  ],
  async (
    req: express.Request<{}, ChatResponse, ChatRequestBody>,
    res: express.Response<ChatResponse>
  ) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { message, context } = req.body;
      const user = req.user as JwtUser;
      
      logger.info(`OpenAI request from user ${user.email}: ${message.substring(0, 50)}...`);

      // Call OpenAI service
      const response = await openAIService.generateChatResponse(message, context);
      
      res.status(200).json({
        success: true,
        response,
      });
    } catch (error) {
      // Check for rate limiting errors
      if (error instanceof Error && (error as any).status === 429) {
        res.status(429).json({
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        });
        return;
      }

      // Log the error with user context
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`OpenAI API Error for user ${(req.user as JwtUser)?.email || 'unknown'}:`, errorMessage);
      
      res.status(500).json({
        success: false,
        error: "Failed to generate response. Please try again later.",
      });
    }
  }
);

export default router;