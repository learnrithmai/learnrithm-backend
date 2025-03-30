// Project: Payment
// Zhouzhou, Backend Intern Team

import { Router } from "express";
import {
  createPayment,
  getPaymentStatus,
  processWebhook,
} from "@/controllers/payment-controller";
import { createPaymentSchema, getPaymentStatusSchema, processWebhookSchema } from "@/validations/paymentSchema";
import validate from "express-zod-safe";

const router = Router({ mergeParams: true });

/* Configure the Routes */
router.post("/createUrl", validate(createPaymentSchema), createPayment);

router.post("/webhook", validate(processWebhookSchema), processWebhook);

router.post("/checkStatus", validate(getPaymentStatusSchema), getPaymentStatus);

// Configure Lemon Squeezy Webhooks
router.post("/lemon-squeezy/webhooks/subscription-status")

router.post("/lemon-squeezy/webhooks/payment-status")

export default router;
