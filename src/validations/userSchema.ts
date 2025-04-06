import { z } from "zod";


export type profile = {
  userId: string;
  country: string;
  createdAt?: Date;
  userDetails: {
    name: string;
    email: string;
    isVerified: boolean;
    lastLogin?: Date;
    image?: string;
    birthDate?: Date;
    phoneNumber?: string;
    institution?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
  },
  subscriptions?: {
    subscriptionId: string;
    status: string;
    trialEndsAt?: Date,
    cardBrand: string;
    cardLastFour: string;
    subscriptionStartAt: Date;
    subscriptionRenewsAt: Date;
    product: string;
  }[];
  currentSubscription?: {
    subscriptionId: string;
    status: string;
    trialEndsAt?: Date;
    cardBrand: string;
    cardLastFour: string;
    subscriptionStartAt: Date;
    subscriptionRenewsAt: Date;
    product: string;
  };
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
// Update Plan Schema
// ────────────────────────────────────────────────────────────────

export const updatePlanSchema = {
  body: z.object({
    id: z.string().min(1, { message: "User ID is required" }),
    plan: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  }),
};

export type UpdatePlanBody = z.infer<typeof updatePlanSchema.body>;

// ────────────────────────────────────────────────────────────────
// Get User Schema
// ────────────────────────────────────────────────────────────────
export const getUserSchema = {
  params: z.object({
    email: z.string({ required_error: "User Email is required" }).email(),
  }),
};

export type GetUserParams = z.infer<typeof getUserSchema.params>;
