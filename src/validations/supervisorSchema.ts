import { z } from "zod";
import { baseSchema } from "./authSchema";
import { stringNonEmpty } from "@/utils/zodUtils";

export const supervisoSchema = {
    body: baseSchema.body,
    params: z.object({
        supervisorId: stringNonEmpty().uuid(),
    }),
};

export type CreateSupervisorBody = z.infer<typeof supervisoSchema.body>;
export type SupervisorParams = z.infer<typeof supervisoSchema.params>;
