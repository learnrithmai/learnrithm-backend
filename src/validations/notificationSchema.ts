// ────────────────────────────────────────────────────────────────
// Create Notification Schema
// ────────────────────────────────────────────────────────────────

import { z } from "zod";

export const createNotification = {
    body: z.object({
        email: z.string().min(1, { message: "Email is required" }),
        type: z.enum([
            "email_validation",
            "password_reset",

            "streak_course",
            "streak_quiz",
            "streak_sign",
            "streak_hit",

            "all_user",
            "update",
            "new_feature",


            "subscription_created",
            "subscription_updated",
            "subscription_cancelled",
            "subscription_expired",

            "subscription_payment_success",
            "subscription_payment_failed",
            "subscription_payment_refunded",
        ]),
    }),
};

export type createNotificationBody = z.infer<typeof createNotification.body>;
