/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable unicorn/no-process-exit */

import { arrayFromString, preprocessUrl, handleZodError, stringNonEmpty } from "@/utils/zodUtils";
import { arabicErrorMap } from "@/validations";

import { z } from "zod";
import { zu } from "zod_utilz";

//? -------- REGEX ---------
const durationRegex = /^(\d+(\.\d+)?(ms|s|m|h|d|w|y))$/;
const hexRegex = /[\da-f]{128}$/i;
const postgresUriRegex =
    /^postgres(?:ql)?:\/\/(?:[^:@]+(?::[^:@]*)?@)?[^#/:?]+(?::\d+)?(?:\/[^#?]*)?(?:\?[^#]*)?(?:#.*)?$/;

//? -------- Error Maps ---------
const tokenExpireErrorMap = zu.makeErrorMap({
    invalid_string: (err: { data: any; }) => `${err.data} : must be a duration string like "2h", "30m", "10s", etc. `,
});

//? -------- Sub Schema ---------
const tokenSchema = stringNonEmpty()
    .length(128, { message: "must be a 128-character string" })
    .regex(hexRegex, { message: "must be a hexadecimal string" });

const tokenExpireSchema = stringNonEmpty(tokenExpireErrorMap).regex(durationRegex);
const numberSchema = z.coerce
    .number()
    .int({ message: "must be integer number" })
    .positive({ message: "must be positive number" });

//? -------- Zod Global Config ---------

// global error map (for the whole schema)
z.setErrorMap(arabicErrorMap);

//? -------- ENV Schema ---------
export const envSchema = z.object({
    DATABASE_URL: stringNonEmpty().regex(postgresUriRegex, {
        message: "must be a valid PostgreSQL URI",
    }),
    DB_NAME: z.string().default("postgres"),
    DB_USER: z.string().default("postgres"),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.preprocess((x) => x || undefined, numberSchema.min(1).max(65_536).default(5432)),

    EMAIL_FROM: stringNonEmpty().email().trim().toLowerCase(),
    EMAIL_PASSWORD: stringNonEmpty(),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    // @ts-expect-error : default value is not an array
    ALLOWED_ORIGINS: arrayFromString(z.string().url(), ["http://localhost:3000"]),
    CLIENT_URL: stringNonEmpty().url(),
    SERVER_URL: stringNonEmpty().transform((url): string =>
        preprocessUrl(url, Number.parseInt(process.env?.PORT as unknown as string) || 3000)
    ),
    SERVER_API_URL: stringNonEmpty()
        .transform((url): string => preprocessUrl(url, Number.parseInt(process.env?.PORT as unknown as string) || 3000))
        .refine((value) => value.includes("api"), {
            message: "must include 'api'",
        }),
    PORT: z.preprocess((x) => x || undefined, numberSchema.min(1).max(65_536).default(3000)),

    //? -------- JWT Config ---------
    JWT_SECRET: stringNonEmpty(),
    JWT_ACCESS_EXPIRATION_MINUTES: z.preprocess((x) => x || undefined, numberSchema.min(1).default(30)),
    JWT_REFRESH_EXPIRATION_DAYS: z.preprocess((x) => x || undefined, numberSchema.min(1).default(30)),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.preprocess((x) => x || undefined, numberSchema.min(1).default(10)),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.preprocess((x) => x || undefined, numberSchema.min(1).default(10)),
});

//*  see : https://catalins.tech/validate-environment-variables-with-zod/
//* for typescript OR next js ( add type , autocomplete for ENV , process.env)

type Env = z.infer<typeof envSchema>;
declare global {
    namespace NodeJS {
        interface ProcessEnv extends Env {}
    }
}

export let ENV: Env;
try {
    ENV = envSchema.parse(process.env);
    // for testing purposes
    // ENV = envSchema.parse({ ALLOWED_ORIGINS: "http://127.0.0.1:5500,http://localhost:3000,http://localhost:3500", PORT: 52, DATABASE_NAME: "mydb", DATABASE_URI: "mongodb://localhost:27017/mydb" });
} catch (error) {
    handleZodError(error);
}
