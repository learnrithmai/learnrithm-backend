import { z } from "zod";
import { emailSchema } from "@/validations"; // Assumes you have a common email validation

// ────────────────────────────────────────────────────────────────
// Create Payment Schema
// ────────────────────────────────────────────────────────────────

export const createPaymentSchema = {
  body: z.object({
    email: emailSchema,
    orderName: z.string().min(1, { message: "Order name is required" }),
    orderVariant: z.string().min(1, { message: "Order variant is required" }),
  }),
};

export type CreatePaymentBody = z.infer<typeof createPaymentSchema.body>;


// ────────────────────────────────────────────────────────────────
// Get Payment Status Schema
// ────────────────────────────────────────────────────────────────

export const getPaymentStatusSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

export type GetPaymentStatusBody = z.infer<typeof getPaymentStatusSchema.body>;


// ────────────────────────────────────────────────────────────────
// Process Payment Webhook Schema
// ────────────────────────────────────────────────────────────────

export const processWebhookSchema = {
  body: z.object({
    data: z.object({
      attributes: z.object({
        product_name: z.string().min(1, { message: "Product name is required" }),
        variant_name: z.string().min(1, { message: "Variant name is required" }),
        // You can add more attributes here as needed
      }),
    }),
    meta: z.object({
      event_name: z.enum([
        "Subscription_Create",
        "Subscription_Update",
        "Subscription_Cancel",
      ]),
    }),
  }),
};

export type ProcessWebhookBody = z.infer<typeof processWebhookSchema.body>;