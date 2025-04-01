/* Interface for streak objects */

export type StreakActivity = "login" | "logout";

export interface NewStreak {
  email: string;
  point: number;
  activities: string[];
  date: Date;
}
