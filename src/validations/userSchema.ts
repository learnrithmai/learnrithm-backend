import { z } from "zod";

// ────────────────────────────────────────────────────────────────
// Base schema: every update must include a user ID.
// ────────────────────────────────────────────────────────────────
const baseUpdateSchema = z.object({
  id: z.string({ required_error: "User ID is required" }),
});

// ────────────────────────────────────────────────────────────────
// Update User Info Schema
// ────────────────────────────────────────────────────────────────
const updateInfoBodySchema = baseUpdateSchema
  .extend({
    name: z.string().optional(),
    lastLogin: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().optional(),
    ),
    imgThumbnail: z.string().optional(),
    plan: z
      .enum([
        "trial_monthly",
        "trial_yearly",
        "charged_monthly",
        "charged_yearly",
      ])
      .optional(),
    ExpirationSubscription: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().optional(),
    ),
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
  })
  .refine(
    (data) => {
      // Ensure at least one field other than `id` is provided.
      const hasUpdate =
        data.name !== undefined ||
        data.lastLogin !== undefined ||
        data.imgThumbnail !== undefined ||
        data.plan !== undefined ||
        data.ExpirationSubscription !== undefined ||
        data.birthDate !== undefined ||
        data.phoneNumber !== undefined ||
        data.institution !== undefined ||
        data.linkedin !== undefined ||
        data.instagram !== undefined ||
        data.facebook !== undefined ||
        data.x !== undefined;
      if (!hasUpdate) return false;
      // If a plan is provided, then ExpirationSubscription must be provided.
      if (data.plan && !data.ExpirationSubscription) return false;
      return true;
    },
    {
      message:
        "At least one field to update is required. If a plan is provided, ExpirationSubscription is required.",
    },
  );

// ────────────────────────────────────────────────────────────────
// Update Password Schema
// ────────────────────────────────────────────────────────────────
const updatePasswordBodySchema = baseUpdateSchema.extend({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

// ────────────────────────────────────────────────────────────────
// Exported Update User Schema
// ────────────────────────────────────────────────────────────────
// The updateUserSchema defines validation for both params and body.
// Params: updateType must be either "UpdateInfo" or "UpdatePassword".
// Body: Must conform to either updateInfoBodySchema or updatePasswordBodySchema.
export const getUserSchema = {
  params: z.object({
    email: z.string({ required_error: "User Email is required" }).email(),
  }),
};

export const updateUserSchema = {
  params: z.object({
    updateType: z.enum(["UpdateInfo", "UpdatePassword"]),
  }),
  body: z.union([updateInfoBodySchema, updatePasswordBodySchema]),
};

export type GetUserParams = z.infer<typeof getUserSchema.params>;
export type UpdateUserParams = z.infer<typeof updateUserSchema.params>;
export type UpdateUserBody = z.infer<typeof updateUserSchema.body>;
