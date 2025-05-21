import { z } from "zod";
import { CountrySchema } from ".";

type subscriptionProfile = {
  subscriptionId: string;
  orderId: string;
  status: string;
  product: string;
  cardBrand?: string;
  cardLastFour?: string;
  subscriptionStartAt: Date;
  subscriptionEndAt: Date;
  billingReason: string;
}

export type profile = {
  userId: string;
  country?: string;
  createdAt?: Date;
  userDetails: {
    name: string;
    email: string;
    isVerified: boolean;
    lastLogin?: Date;
    image?: string;
    birthDate: Date;
    phoneNumber?: string;
    institution?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    howDidYouFindUs: string;
    whoAreYou: string;
    age: number;
  },
  subscriptions?: subscriptionProfile[];
  currentSubscription?: subscriptionProfile;
}

// ────────────────────────────────────────────────────────────────
// Update User Info Schema
// ────────────────────────────────────────────────────────────────
export const updateInfoSchema = {
  body: z.object({
    id: z.string().min(1, { message: "User ID is required" }),
    name: z.string().optional(),
    lastLogin: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().optional(),
    ),
    country: CountrySchema.optional(),
    image: z.string().optional(),
    birthDate: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().optional(),
    ),
    phoneNumber: z.string().optional(),
    institution: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    x: z.string().optional(),
  }),
};

export type UpdateInfoBody = z.infer<typeof updateInfoSchema.body>;

// ────────────────────────────────────────────────────────────────
// Update User language Info Schema
// ────────────────────────────────────────────────────────────────
export const updateLanguageSchema = {
  body: z.object({
    id: z.string().min(1, { message: "User ID is required" }),
    language: z.string().min(1, { message: "User language is required" }),
  }),
};

export type UpdateLanguageBody = z.infer<typeof updateLanguageSchema.body>;

// ────────────────────────────────────────────────────────────────
// Update Password Schema
// ────────────────────────────────────────────────────────────────

export const updatePasswordSchema = {
  body: z.object({
    id: z.string().min(1, { message: "User ID is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    newPassword: z
      .string()
      .min(8, { message: "New password must be at least 8 characters" }),
  }),
};

export type UpdatePasswordBody = z.infer<typeof updatePasswordSchema.body>;


// ────────────────────────────────────────────────────────────────
// Get User Schema
// ────────────────────────────────────────────────────────────────
export const getUserSchema = {
  params: z.object({
    email: z.string({ required_error: "User Email is required" }).email(),
  }),
};

export type GetUserParams = z.infer<typeof getUserSchema.params>;
