/* Utils functions for Payment Service */

export const getTimeDifference = (date: Date): number => {
  if (isNaN(date.getTime())) {
    throw new Error("Invalid input Date.");
  }
  const now: Date = new Date();
  const timeDifference: number = date.getTime() - now.getTime();
  return timeDifference;
};

export const addMonthsUtil = (date: Date, months: number): Date => {
  if (isNaN(date.getTime())) {
    throw new Error("Invalid input Date.");
  }
  const newDate: Date = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const addYearsUtil = (date: Date, years: number): Date => {
  if (isNaN(date.getTime())) {
    throw new Error("Invalid input Date.");
  }
  const newDate: Date = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};
