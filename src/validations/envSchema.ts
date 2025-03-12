/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-namespace */

import {
  arrayFromString,
  preprocessUrl,
  handleZodError,
  stringNonEmpty,
} from "@/utils/zodUtils";
import { z } from "zod";
// import { zu } from "zod_utilz";

// // -------- REGEX ---------
// const durationRegex = /^(\d+(\.\d+)?(ms|s|m|h|d|w|y))$/;
// const hexRegex = /^[\da-f]{128}$/i;
const postgresUriRegex =
  /^postgres(?:ql)?:\/\/(?:[^:@]+(?::[^:@]*)?@)?[^#/:?]+(?::\d+)?(?:\/[^#?]*)?(?:\?[^#]*)?(?:#.*)?$/;

// -------- Error Maps ---------
// const tokenExpireErrorMap = zu.makeErrorMap({
//   invalid_string: (err: { data: string }) =>
//     `${err.data} must be a duration string like "2h", "30m", or "10s".`
// });

// -------- Sub Schemas ---------
// const tokenSchema = stringNonEmpty()
//   .length(128, { message: "Token must be a 128-character string." })
//   .regex(hexRegex, { message: "Token must be a valid hexadecimal string." });

// const tokenExpireSchema = stringNonEmpty(tokenExpireErrorMap)
//   .regex(durationRegex, { message: "Expiration must be a duration string (e.g., '2h', '30m', '10s')." });

const numberSchema = z.coerce
  .number()
  .int({ message: "Must be an integer number." })
  .positive({ message: "Must be a positive number." });

// -------- ENV Schema ---------
export const envSchema: z.ZodObject<{
  DATABASE_URL: z.ZodString;
  DB_NAME: z.ZodDefault<z.ZodString>;
  DB_USER: z.ZodDefault<z.ZodString>;
  DB_HOST: z.ZodDefault<z.ZodString>;
  DB_PORT: z.ZodEffects<z.ZodDefault<z.ZodNumber>, number, unknown>;
  EMAIL_FROM: z.ZodString;
  EMAIL_PASSWORD: z.ZodString;
  NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production"]>>;
  ALLOWED_ORIGINS: z.ZodArray<z.ZodString>;
  CLIENT_URL: z.ZodString;
  SERVER_URL: z.ZodEffects<z.ZodString, string, string>;
  SERVER_API_URL: z.ZodEffects<
    z.ZodEffects<z.ZodString, string, string>,
    string,
    string
  >;
  PORT: z.ZodEffects<z.ZodDefault<z.ZodNumber>, number, unknown>;
  JWT_SECRET: z.ZodString;
  JWT_ACCESS_EXPIRATION_MINUTES: z.ZodEffects<
    z.ZodDefault<z.ZodNumber>,
    number,
    unknown
  >;
  JWT_REFRESH_EXPIRATION_DAYS: z.ZodEffects<
    z.ZodDefault<z.ZodNumber>,
    number,
    unknown
  >;
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.ZodEffects<
    z.ZodDefault<z.ZodNumber>,
    number,
    unknown
  >;
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.ZodEffects<
    z.ZodDefault<z.ZodNumber>,
    number,
    unknown
  >;
  ZOHO_SMTP_HOST: z.ZodDefault<z.ZodString>;
  ZOHO_SMTP_PORT: z.ZodEffects<z.ZodDefault<z.ZodNumber>, number, unknown>;
  ZOHO_SMTP_USERNAME: z.ZodString;
  ZOHO_SMTP_PASSWORD: z.ZodString;
}> = z.object({
  // Database configuration
  DATABASE_URL: stringNonEmpty().regex(postgresUriRegex, {
    message: "DATABASE_URL must be a valid PostgreSQL URI.",
  }),
  DB_NAME: z.string().default("postgres"),
  DB_USER: z.string().default("postgres"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.preprocess(
    (x) => (x ? Number(x) : undefined),
    numberSchema.min(1).max(65536).default(5432),
  ),

  // Email configuration
  EMAIL_FROM: stringNonEmpty().email().trim().toLowerCase(),
  EMAIL_PASSWORD: stringNonEmpty(),

  // Environment
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  ALLOWED_ORIGINS: arrayFromString(z.string().url(), "http://localhost:3000"),
  CLIENT_URL: stringNonEmpty().url(),

  // Server URLs (transformed using the PORT value from process.env)
  SERVER_URL: stringNonEmpty().transform((url) =>
    preprocessUrl(
      url,
      Number.parseInt(process.env?.PORT as unknown as string) || 3000,
    ),
  ),
  SERVER_API_URL: stringNonEmpty()
    .transform((url) =>
      preprocessUrl(
        url,
        Number.parseInt(process.env?.PORT as unknown as string) || 3000,
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
});

// Infer ENV type from the schema
type Env = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}

export let ENV: Env;
try {
  ENV = envSchema.parse(process.env);
} catch (error) {
  handleZodError(error);
}
