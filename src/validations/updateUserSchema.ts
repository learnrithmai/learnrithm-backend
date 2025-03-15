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
      z.date().optional()
    ),
    imgThumbnail: z.string().optional(),
    plan: z
      .enum(["trial_monthly", "trial_yearly", "charged_monthly", "charged_yearly"])
      .optional(),
    ExpirationSubscription: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().optional()
    ),
  })
  .refine(
    (data) => {
      // Ensure at least one field other than `id` is provided.
      const hasUpdate =
        data.name !== undefined ||
        data.lastLogin !== undefined ||
        data.imgThumbnail !== undefined ||
        data.plan !== undefined ||
        data.ExpirationSubscription !== undefined;
      if (!hasUpdate) return false;
      // If a plan is provided, then ExpirationSubscription must be provided.
      if (data.plan && !data.ExpirationSubscription) return false;
      return true;
    },
    {
      message:
        "At least one field to update is required. If a plan is provided, ExpirationSubscription is required.",
    }
  );

// ────────────────────────────────────────────────────────────────
// Update Password Schema
// ────────────────────────────────────────────────────────────────
const updatePasswordBodySchema = baseUpdateSchema.extend({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

// ────────────────────────────────────────────────────────────────
// Exported Update User Schema
// ────────────────────────────────────────────────────────────────
// This schema is an object with a "body" property that is a union of the two possibilities.
export const updateUserSchema = {
  body: z.union([updateInfoBodySchema, updatePasswordBodySchema]),
};

export type UpdateUserBody = z.infer<typeof updateUserSchema.body>;