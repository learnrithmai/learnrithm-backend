import { stringNonEmpty } from "@/utils/zodUtils";
import { CountrySchema, credinalSchema, emailSchema, refineStatesSchema, usernameSchema } from "@/validations";
import { Gender, RiwayaType, RoleType } from "@prisma/client";
import { isValidPhoneNumber } from 'libphonenumber-js';
import { z } from "zod";



// * --------------------------------------------------------------------------------
// *  ------------------  🔰  Shared Base Schema  ----------------------

export const baseSchema = {
    body: z.object({
        firstName: credinalSchema,
        lastName: credinalSchema,
        email: emailSchema,
        password: stringNonEmpty().min(6),
        country: CountrySchema,
        phone: z.string().refine(isValidPhoneNumber, { message: "Incorrect Phone Number" }).or(z.literal("")),
    })
};


// * --------------------------------------------------------------------------------
// *  ------------------  👨‍🎓  User SignUp Schema  ----------------------


export const registerUserSchema = {
    body: baseSchema.body.extend({
        riwaya: z.nativeEnum(RiwayaType),
    }).superRefine(refineStatesSchema),
};

export type RegisterUserBody = z.infer<typeof registerUserSchema.body>;


// * --------------------------------------------------------------------------------
// *  -----------------------------  🔐  Auth  --------------------------------------

export const loginSchema = {
    body: baseSchema.body.pick({ password: true }).extend({
        identifier: emailSchema.or(usernameSchema),
    }),
};

export type LoginBody = z.infer<typeof loginSchema.body>;

export const forgotPasswordSchema = {
    body: baseSchema.body.pick({ email: true }),
};

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.body>;

export const resetPasswordSchema = {
    query: z.object({
        token: z.string(),
    }),
    body: baseSchema.body.pick({ password: true }),
};

export type ResetPasswordQuery = z.infer<typeof resetPasswordSchema.query>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;

export const verifyEmailSchema = {
    query: z.object({
        token: z.string(),
    }),
};

export type verifyEmailQuery = z.infer<typeof verifyEmailSchema.query>;
