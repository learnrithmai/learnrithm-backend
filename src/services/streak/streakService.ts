/* Service of Streak */
import { PrismaClient } from "@prisma/client";
import { NewStreak, StreakActivity } from "@/types/streak";
import { Streak } from "@prisma/client";

// ? Better replace this prisma with that one in "config"
const prisma: PrismaClient = new PrismaClient();

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

// Create New steak for a user
export const createNewStreak = async (email: string): Promise<Streak> => {
  // Check if User logged in before
  const lastDayStreak: Streak | null = await getLastDayStreak(email);
  const point: number = lastDayStreak ? lastDayStreak.point + 1 : 0;

  // Get today's new date
  const today: Date = getTodayDate();
  // Construct the Streak
  const newStreak: NewStreak = {
    email: email,
    date: today,
    activities: [],
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

  thisStreak.activities.push(activity);
  return await updateStreak(thisStreak);
};
