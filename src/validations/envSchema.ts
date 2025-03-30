/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-namespace */

import { z } from "zod";
import {
  preprocessUrl,
  handleZodError,
  stringNonEmpty,
} from "@/utils/zodUtils";

// -------- REGEX ---------
const mongoUriRegex =
  /^mongodb(?:\+srv)?:\/\/(?:[^:@]+(?::[^:@]*)?@)?[^#/:?]+(?:\/[^#?]*)?(?:\?[^#]*)?$/;

// -------- Number Schema ---------
const numberSchema = z.coerce
  .number()
  .int({ message: "Must be an integer number." })
  .positive({ message: "Must be a positive number." });

// -------- ENV Schema ---------
export const envSchema = z.object({
  // Database configuration
  DATABASE_URL: stringNonEmpty().regex(mongoUriRegex, {
    message: "DATABASE_URL must be a valid MongoDB URI.",
  }),
  DB_NAME: z.string().default("learnrithm"),
  DB_USER: z.string().default("admin"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).max(65536).default(27017), // MongoDB default port
  ),

  // OpenAI configuration
  OPENAI_API_KEY: stringNonEmpty(),
  OPENAI_MODEL: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  ALLOWED_ORIGINS: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val); // Convert the string to an array
      } catch {
        return val.split(",").map((url) => url.trim()); // Fallback: split by commas
      }
    }
    return val;
  }, z.array(z.string().url())),
  CLIENT_URL: stringNonEmpty().url(),

  // Server URLs (transformed using the PORT value from process.env)
  SERVER_URL: stringNonEmpty().transform((url): string =>
    preprocessUrl(
      url,
      Number.parseInt(process.env?.PORT as unknown as string) || 5000,
    ),
  ),
  SERVER_API_URL: stringNonEmpty()
    .transform((url): string =>
      preprocessUrl(
        url,
        Number.parseInt(process.env?.PORT as unknown as string) || 5000,
      ),
    )
    .refine((value) => value.includes("api"), {
      message: "SERVER_API_URL must include 'api'.",
    }),
  PORT: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).max(65536).default(3000),
  ),

  // JWT Configuration
  JWT_SECRET: stringNonEmpty(),
  JWT_ACCESS_EXPIRATION_MINUTES: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).default(30),
  ),
  JWT_REFRESH_EXPIRATION_DAYS: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).default(30),
  ),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).default(10),
  ),
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).default(10),
  ),
  // SMTP Configuration
  ZOHO_SMTP_HOST: stringNonEmpty().default("smtp.zoho.com"),
  ZOHO_SMTP_PORT: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).max(65536).default(587),
  ),
  ZOHO_SMTP_USERNAME: stringNonEmpty().email(),
  ZOHO_SMTP_PASSWORD: stringNonEmpty(),

  //Lemon Squeeze Keys
  LEMON_KEY: stringNonEmpty(),
  STORE_ID: stringNonEmpty(),
});

// Infer ENV type from the schema
type Env = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env { }
  }
}

export let ENV: Env;
try {
  ENV = envSchema.parse(process.env);
} catch (error) {
  handleZodError(error);
}
