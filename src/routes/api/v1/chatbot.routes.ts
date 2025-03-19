import express from "express";
import { generateChatResponse } from "../../../controllers/chatbot/chatbotController";
import passport from "passport";

const router = express.Router();

/**
 * @swagger
 * /api/v1/chatbot:
 *   post:
 *     summary: Generate a response from the AI chatbot
 *     tags: [Chatbot]
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
 *                 description: The user's message
 *               context:
 *                 type: string
 *                 description: Optional context to provide to the chatbot
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    await generateChatResponse(req, res, next);
  },
);

export default router;
