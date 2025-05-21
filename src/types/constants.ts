
export const USER_TYPES = [
  "High schooler",
  "University student",
  "Graduate",
  "Masters student",
  "KG-12",
  "PhD student",
] as const;

export type UserType = typeof USER_TYPES[number];
