import { z } from "zod";
import { emailSchema, CountrySchema } from "@/validations";

// ────────────────────────────────────────────────────────────────
// Register User Schema
// ────────────────────────────────────────────────────────────────

export const registerUserSchema = {
  body: z.object({
    Name: z.string().min(1, { message: "Name is required" }),
    email: emailSchema,
    password: z.string(),
    country: CountrySchema.optional(),
    referralCode: z.string().optional(),
    image: z.string().optional(),
    dontRememberMe: z.boolean().default(false),
  }),
};

export type RegisterUserBody = z.infer<typeof registerUserSchema.body>;


// ────────────────────────────────────────────────────────────────
// Register User Google Schema
// ────────────────────────────────────────────────────────────────


export const RegisterUserGoogleSchema = {
  body: z.object({
    Name: z.string().min(1, { message: "Name is required" }),
    email: emailSchema,
    image: z.string().optional(),
  }),
};

export type RegisterUserGoogleBody = z.infer<typeof RegisterUserGoogleSchema.body>;

// ────────────────────────────────────────────────────────────────
// Response User Schema
// ────────────────────────────────────────────────────────────────


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
    dontRememberMe: z.boolean().default(false),
  }),
};

export type LoginBody = z.infer<typeof loginSchema.body>;

// ────────────────────────────────────────────────────────────────
// Login Google Schema
// ────────────────────────────────────────────────────────────────

export const LoginGoogleBody = {
  body: z.object({
    email: z.string().min(1, { message: "Identifier is required" }),
    image: z.string().optional(),
  }),
};

export type LoginGoogleBody = z.infer<typeof LoginGoogleBody.body>;


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
