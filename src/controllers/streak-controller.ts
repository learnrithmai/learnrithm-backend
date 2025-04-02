/* Streak Service, Zhouzhou, Backend Intern team */
import {
  createNewStreak,
  getScore,
  getStreak,
  getTodayDate,
  logStreakActivity,
} from "@/utils/streakUtil";
import { Request, Response } from "express";
import { Prisma, Score, Streak } from "@prisma/client";
import { StreakActivity } from "@/types/streak";

export const StreakHandler = async (req: Request, res: Response) => {
  // Get Email
  const email: string | null = req.body.email;
  // Get Activity
  const activity: StreakActivity | null = req.body.activity;
  // Check if Email and Acticity exists
  if (!email || !activity) {
    return res.status(400).json({ error: "Email or Activity not provided" });
  }
  try {
    // Case 1: Today's first login. Create new streak
    if (activity == "login") {
      const response: Streak = await createNewStreak(email);
      const score: Score | null = await getScore(email);
      res.status(200).json({
        message: "Successfully created the new streak",
        streak: response,
        socre: score?.score,
      });
      // Case 2: Add acticity on an existing streak
    } else if (
      activity == "create_course" ||
      activity == "create_quiz" ||
      activity == "unlock_subtopic"
    ) {
      const response: Streak = await logStreakActivity(email, activity);
      const score: Score | null = await getScore(email);
      res.status(200).json({
        message: "Successfully updated the streak",
        streak: response,
        score: score?.score,
      });
    } else {
      res.status(400).json({
        error: "Unknown activity",
        message:
          "Supported activity: login, create_course, unlock_subtopic, create_quiz",
      });
    }
  } catch (error) {
    if (
      // Unique error
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(400)
        .json({ message: "Streak Already exist", error: error });
    } else {
      return res.status(400).json({
        message:
          "Unknown Error. Can not create new streak. Check the Database connecting",
        error: error,
      });
    }
  }
};

export const GetStreakHandler = async (req: Request, res: Response) => {
  // Get email
  const email: string | null = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  // Get streak
  const thisStreak: Streak | null = await getStreak(email, getTodayDate());

  if (!thisStreak) {
    return res.status(400).json({ error: "Streak not found." });
  }

  // Get score
  const score: Score | null = await getScore(email);
  if (!score) {
    return res
      .status(400)
      .json({ error: "Score not found. Try log in first." });
  }

  res.status(200).json({
    message: "Streak and Score successfully found.",
    streak: thisStreak,
    score: score.score,
  });
};
