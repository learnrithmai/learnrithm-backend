/* Interface for streak objects */

export type StreakActivity =
  | "login"
  | "create_course"
  | "unlock_subtopic"
  | "create_quiz";

export interface NewStreak {
  email: string;
  point: number;
  activities: string[];
  date: Date;
}
