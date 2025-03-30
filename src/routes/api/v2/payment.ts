import { subscriptionHandler, subscriptionPaymentHandler } from "@/controllers/payment-controller";
import { Router } from "express";

const router = Router({ mergeParams: true });

// Configure Lemon Squeezy Webhooks

router.post("/lemon-squeezy/webhooks/subscription-status", subscriptionHandler)

router.post("/lemon-squeezy/webhooks/payment-status", subscriptionPaymentHandler)

export default router;