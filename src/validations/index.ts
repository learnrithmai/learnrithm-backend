import countries from "@/data/countries.json";
import states from "@/data/states.json";
import { stringNonEmpty } from "@/utils/zodUtils";
import { z } from "zod";

//? -------- REGEX ---------
export const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&*?@])[\d!#$%&*?@A-Za-z]{8,}$/;
export const hexRegex = /[\da-f]{40}$/i;

//? -------- Sub Schema ---------
export const credinalSchema = stringNonEmpty().trim().min(3).max(25);
export const emailSchema = stringNonEmpty().email().trim().toLowerCase();
export const usernameSchema = stringNonEmpty().trim();
export const infoSchema = z.string().trim().min(3).max(25).optional();
export const tokenSchema = stringNonEmpty()
    .length(40, { message: "must be a 40-character string" })
    .regex(hexRegex, { message: "must be a hexadecimal string" });

export const CountrySchema = z.enum([countries[0].name, ...countries.slice(1).map((country) => country.name)], {
    message: "البلد المدخل غير موجود , يرجى إدخال إحدى بلدان العالم",
});

//? --------  Refinments ---------
//@ts-expect-error any type
export const refineStatesSchema = (data : any, ctx : any) => {
    const countryStates = states.filter((s) => s.country_name === data.country);
    if (countryStates.length > 0 && data.state === "") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "هذه الخانة إجبارية",
            path: ["state"],
        });
    } else if (countryStates.length > 0 && !countryStates.some((s) => s.name === data.state)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "البلد المدخل غير صالح , يرجى إدخال إحدى البلدان المتاحة",
            path: ["state"],
        });
    }
};


//? Global error

export const arabicErrorMap: z.ZodErrorMap = (issue, ctx) => {
    switch (issue.code) {
        case z.ZodIssueCode.too_small: {
            if (issue.minimum === 3) {
                return { message: "يجب أن تحتوي هذه الخانة على 3 أحرف على الأقل" };
            }
            return { message: `القيمة المدخلة يجب أن تكون أكبر من أو تساوي ${issue.minimum}` };
        }
        case z.ZodIssueCode.too_big: {
            return { message: `القيمة المدخلة يجب أن تكون أقل من أو تساوي ${issue.maximum}` };
        }
        case z.ZodIssueCode.invalid_type: {
            return { message: `النوع المدخل غير صحيح. مطلوب: ${issue.expected}` };
        }
        case z.ZodIssueCode.invalid_string: {
            if (issue.validation === "email") {
                return { message: "البريد الإلكتروني المدخل غير صالح" };
            }
            if (issue.validation === "url") {
                return { message: "الرابط المدخل غير صالح" };
            }
            return { message: "القيمة المدخلة يجب أن تكون نصًا صالحًا" };
        }
        case z.ZodIssueCode.invalid_enum_value: {
            return {
                message: `القيمة المدخلة غير صالحة. الخيارات المسموح بها: ${issue.options?.join(", ")}`
            };
        }
        default: {
            return { message: ctx.defaultError };
        }
    }
};


z.setErrorMap(arabicErrorMap);
