import { z } from "zod";
import { emailSchema, CountrySchema } from "@/validations";

// ────────────────────────────────────────────────────────────────
// Register User Schema
// ────────────────────────────────────────────────────────────────

export const registerUserSchema = {
  body: z.object({
    Name: z.string().min(1, { message: "Name is required" }),
    email: emailSchema,
    password: z.string().optional(),
    country: CountrySchema.optional(),
    referralCode: z.string().optional(),
    method: z.enum(["normal", "google"]),
    image: z.string().optional(),
  }),
};

export type RegisterUserBody = z.infer<typeof registerUserSchema.body>;

export type ResponseUserSchema = {
  id: string;
  Name: string;
  email: string;
  method: string;
  lastLogin: string;
  imgThumbnail?: string;
  token: {
    accessToken: string;
    refreshToken: string;
    tokenExpiry: number;
  };
};

// ────────────────────────────────────────────────────────────────
// Login Schema
// ────────────────────────────────────────────────────────────────

export const loginSchema = {
  body: z.object({
    email: z.string().min(1, { message: "Identifier is required" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  }),
};

export type LoginBody = z.infer<typeof loginSchema.body>;

// ────────────────────────────────────────────────────────────────
// Forgot Password Schema
// ────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.body>;

// ────────────────────────────────────────────────────────────────
// Reset Password Schema
// ────────────────────────────────────────────────────────────────

export const resetPasswordSchema = {
  query: z.object({
    token: z.string(),
  }),
  body: z.object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  }),
};

export type ResetPasswordQuery = z.infer<typeof resetPasswordSchema.query>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;

// ────────────────────────────────────────────────────────────────
// Verify Email Schema
// ────────────────────────────────────────────────────────────────

export const verifyEmailSchema = {
  query: z.object({
    token: z.string(),
  }),
};

export type VerifyEmailQuery = z.infer<typeof verifyEmailSchema.query>;
