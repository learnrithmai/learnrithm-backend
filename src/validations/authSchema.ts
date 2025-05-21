import { z } from "zod";
import { emailSchema, CountrySchema } from "@/validations";
import { USER_TYPES } from "@/types/constants";

// ────────────────────────────────────────────────────────────────
// Register User Schema
// ────────────────────────────────────────────────────────────────

export const registerUserSchema = {
  body: z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: emailSchema,
    password: z.string().optional(),
    country: CountrySchema.optional(),
    referralCode: z.string().optional(),
    image: z.string().optional(),
    method: z.enum(['normal', 'google']),
    dontRememberMe: z.boolean().default(false),
    howDidYouFindUs: z.string().min(1, { message: "Please tell us how you found us" }),
    whoAreYou: z.enum(USER_TYPES, { 
      errorMap: () => ({ message: "Please select who you are" })
    }),
    age: z.number({ 
      required_error: "Age is required",
      invalid_type_error: "Age must be a number" 
    }).int().min(0).max(100),
    birthDate: z.coerce.date({
      required_error: "Birth date is required",
      invalid_type_error: "Birth date must be a valid date"
    }),
  }),
};

export type RegisterUserBody = z.infer<typeof registerUserSchema.body>;


// ────────────────────────────────────────────────────────────────
// Login Schema
// ────────────────────────────────────────────────────────────────

export const loginSchema = {
  body: z.object({
    email: z.string().min(1, { message: "Identifier is required" }),
    password: z.string().optional(),
    image: z.string().optional(),
    dontRememberMe: z.boolean().default(false),
    method: z.enum(['normal', 'google']),
  }),
};

export type LoginBody = z.infer<typeof loginSchema.body>;


// ────────────────────────────────────────────────────────────────
// Response User Schema
// ────────────────────────────────────────────────────────────────


export type ResponseUserSchema = {
  id: string;
  name: string;
  email: string;
  method: string;
  lastLogin: string;
  image?: string;
  tokens: {
    access: {
      token: string;
      expires: Date;
    };
    refresh: {
      token: string;
      expires: Date;
    };
  }
};

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
