import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Updates or creates a streak record when a user takes an action.
 */
export const updateStreak = async (
  userId: string,
  email: string,
  action: "sign-in" | "quiz" | "course"
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    let streak = await prisma.streaker.findUnique({ where: { userId } });

    if (!streak) {
      // Create new streak record
      streak = await prisma.streaker.create({
        data: {
          userId,
          email,
          dateSign: today,
          quizDo: action === "quiz",
          courseDo: action === "course",
        },
      });
    } else {
      // Update existing streak record
      const lastSignIn = new Date(streak.dateSign);
      lastSignIn.setHours(0, 0, 0, 0);

      if (lastSignIn.getTime() !== today.getTime()) {
        // Reset streak if it's a new day
        streak = await prisma.streaker.update({
          where: { userId },
          data: {
            dateSign: today,
            quizDo: action === "quiz",
            courseDo: action === "course",
          },
        });
      } else {
        // Update streak actions without resetting the date
        streak = await prisma.streaker.update({
          where: { userId },
          data: {
            quizDo: action === "quiz" ? true : streak.quizDo,
            courseDo: action === "course" ? true : streak.courseDo,
          },
        });
      }
    }

    return streak;
  } catch (error) {
    console.error("Error updating streak:", error);
    throw new Error("Failed to update streak");
  }
};

/**
 * Retrieves the current streak status for a user.
 */
export const getStreakStatus = async (userId: string) => {
  return await prisma.streaker.findUnique({
    where: { userId },
  });
};
