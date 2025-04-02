/* Service of Streak */
import { Score } from "@prisma/client";
import { NewStreak, StreakActivity } from "@/types/streak";
import { Streak } from "@prisma/client";
import prisma from "@/config/db/prisma";

// * Score added for each operation
export const SCORE: number = 10;

// Get the date of today
export const getTodayDate = (): Date => {
  const now: Date = new Date();
  const today: Date = new Date( // Only care the Date, not the time
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  return today;
};

// Get the date of last day
export const getLastDate = (): Date => {
  const today: Date = getTodayDate();
  today.setDate(today.getDate() - 1);
  const lastDay: Date = today;
  return lastDay;
};

// Search for a streak
export const getStreak = async (
  email: string,
  date: Date
): Promise<Streak | null> => {
  return await prisma.streak.findUnique({
    where: {
      email_date: {
        email: email,
        date: date,
      },
    },
  });
};

// Search for last day's information
export const getLastDayStreak = async (
  email: string
): Promise<Streak | null> => {
  const lastDay: Date = getLastDate();
  const lastDayStreak: Streak | null = await getStreak(email, lastDay);
  return lastDayStreak;
};

// Search for user's score
export const getScore = async (email: string): Promise<Score | null> => {
  return await prisma.score.findUnique({ where: { email: email } });
};

// Update a user's score
export const updateScore = async (score: Score): Promise<Score> => {
  return prisma.score.update({
    where: { email: score.email },
    data: {
      score: score.score,
    },
  });
};

// Create New steak for a user
export const createNewStreak = async (email: string): Promise<Streak> => {
  // Check if User logged in before
  const lastDayStreak: Streak | null = await getLastDayStreak(email);
  const point: number = lastDayStreak ? lastDayStreak.point + 1 : 1;

  // Check if User has a Score, created new one if not
  if (!(await prisma.score.findUnique({ where: { email: email } }))) {
    await prisma.score.create({ data: { email: email, score: 0 } });
  }
  // Get today's new date
  const today: Date = getTodayDate();
  // Construct the Streak
  const newStreak: NewStreak = {
    email: email,
    date: today,
    activities: ["login"],
    point: point,
  };
  // ! Throw error if this streak already exists
  return await prisma.streak.create({ data: newStreak });
};

// Update a streak for a user
export const updateStreak = async (streak: Streak): Promise<Streak> => {
  return prisma.streak.update({
    where: { email_date: { email: streak.email, date: streak.date } },
    data: {
      point: streak.point,
      activities: streak.activities,
    },
  });
};

// Log an activity on this streak
export const logStreakActivity = async (
  email: string,
  activity: StreakActivity
): Promise<Streak> => {
  // Find the user's streak
  let thisStreak: Streak;
  const streak: Streak | null = await getStreak(email, getTodayDate());
  if (!streak) {
    thisStreak = await createNewStreak(email);
  } else {
    thisStreak = streak;
  }

  // Add activity
  thisStreak.activities.push(activity);

  // Add score
  const thisScore: Score | null = await getScore(email);
  if (!thisScore) {
    throw new Error("Score data not found! Please log in first!");
  }
  await addScore(thisScore, activity);

  // Update the streak
  return await updateStreak(thisStreak);
};

// Add score to a "Score" type
export const addScore = async (
  score: Score,
  activity: StreakActivity
): Promise<Score> => {
  // TODO: You can modify the exact score to add, here.
  if (activity == "create_course") {
    score.score += SCORE;
  } else if (activity == "create_quiz") {
    score.score += SCORE;
  } else if (activity == "unlock_subtopic") {
    score.score += SCORE;
  } else {
    // Pass
  }
  // Update the score
  return await updateScore(score);
};
