import { stringNonEmpty } from "@/utils/zodUtils";
import { z } from "zod";

//? -------- REGEX ---------

//? -------- Sub Schema ---------

// Base schema for common fields
const baseOpenSessionSchema = z.object({
    title: stringNonEmpty(),
    link: stringNonEmpty().url("must be a valid Google Meet Link"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
});

// Schema for open session with teacherId
export const openSessionSchema = {
    body: baseOpenSessionSchema.extend({
        teacherId: stringNonEmpty(),
    }),
};

export type OpenSessionBody = z.infer<typeof openSessionSchema.body>;

// Schema for current teacher open session without teacherId
export const currentTeacherOpenSessionSchema = {
    body: baseOpenSessionSchema,
};

export type CurrentTeacherOpenSessionBody = z.infer<typeof currentTeacherOpenSessionSchema.body>;
