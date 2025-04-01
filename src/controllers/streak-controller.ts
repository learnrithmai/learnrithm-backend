/* Streak Service, Zhouzhou, Backend Intern team */
import { createNewStreak } from "@/services/streak/streakService";
import { Request, Response } from "express";
import { Prisma, Streak } from "@prisma/client";

// First Log In on each day
export const login_streak = async (req: Request, res: Response) => {
  // Get Email
  const email: string | null = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "Email not provided" });
  }
  // Create new streak for this user
  try {
    const response: Streak = await createNewStreak(email);
    res
      .status(200)
      .json({ message: "Successfully created the new streak", data: response });
  } catch (error) {
    // Unique error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(400)
        .json({ message: "Streak Already exist", error: error });
    }
  }
};
