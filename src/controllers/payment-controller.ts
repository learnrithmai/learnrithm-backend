import prisma from "@/config/db/prisma";
import { asyncWrapper } from "@/middleware/asyncWrapper";
import { formattedPlan, logPaymentMsg } from "@/utils/paymentUtils";
import { planType } from "@prisma/client";
import { Request, Response } from "express";

export const subscriptionHandler = asyncWrapper(async (req: Request, res: Response) => {
  const { meta, data } = req.body;

  if (!meta?.event_name || !data?.attributes) {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  const { event_name } = meta;
  const attributes = data.attributes;

  const user = await prisma.user.findFirst({
    where: { email: attributes.user_email },
  });

  if (!user) {
    return res.status(404).json({ error: "User with that email not found" });
  }

  try {
    switch (event_name) {
      case "subscription_created": {
        // Create a new subscription
        await prisma.subscription.create({
          data: {
            id: data.id,
            userId: user.id,
            email: user.email,
            cardBrand: attributes.card_brand,
            cardLastFour: attributes.card_last_four,
            status: attributes.status,
            trialEndsAt: `${new Date(attributes.trial_ends_at)}`,
            product: attributes.product_name,
            subscriptionStartAt: `${new Date(attributes.created_at)}`,
            subscriptionRenewsAt: `${new Date(attributes.renews_at)}`,
          },
        });


        // Update the user's plan and subscription expiration date
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: formattedPlan(attributes.product_name, attributes.status === "on_trial") as planType,
            ExpirationSubscription: new Date(attributes.renews_at),
          },
        });

        await logPaymentMsg(
          {
            email: attributes.user_email,
            trialEndsAt: attributes.trial_ends_at,
            cardBrand: attributes.card_brand,
            cardLastFour: attributes.card_last_four,
            subscriptionStartAt: attributes.created_at,
            subscriptionRenewsAt: attributes.renews_at,
            status: attributes.status,
          },
          event_name
        );
        break;
      }

      case "subscription_updated": {
        // Update subscription record
        await prisma.subscription.update({
          where: { id: data.id },
          data: {
            status: attributes.status,
            trialEndsAt: `${new Date(attributes.trial_ends_at)}`,
            subscriptionRenewsAt: `${new Date(attributes.renews_at)}`,
            subscriptionStartAt: `${new Date(attributes.updated_at)}`
          },
        });

        // Update the user's plan and subscription expiration date

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: formattedPlan(attributes.product_name, attributes.status === "on_trial") as planType,
            ExpirationSubscription: new Date(attributes.renews_at),
          },
        });

        await logPaymentMsg(attributes, event_name);

        // Create/update notifier for subscription update
        await prisma.notifier.create({
          data: {
            userId: user?.id,
            email: user.email,
            notifyType: "subscription_updated",
            notify: new Date(),
          },
        });
        break;
      }

      case "subscription_cancelled": {
        // Update subscription status to cancelled
        await prisma.subscription.update({
          where: { id: data.id },
          data: { status: "cancelled" },
        });
        console.log("Subscription Cancelled:", attributes);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            ExpirationSubscription: null,
          },
        });

        await logPaymentMsg(attributes, event_name);

        // Create/update notifier for cancellation
        await prisma.notifier.create({
          data: {
            userId: user.id,
            email: user.email,
            notifyType: "subscription_cancelled",
            notify: new Date(),
          },
        });
        break;
      }

      case "subscription_expired": {
        // Update subscription status to expired
        await prisma.subscription.update({
          where: { id: data.id },
          data: { status: "expired" },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            ExpirationSubscription: null,
          },
        });

        await logPaymentMsg(attributes, event_name);

        // Create/update notifier for expiration
        await prisma.notifier.create({
          data: {
            userId: user.id,
            email: user.email,
            notifyType: "subscription_expired",
            notify: new Date(),
          },
        });
        break;
      }

      default:
        console.warn(`Unhandled event type: ${event_name}`);
        return res.status(400).json({ message: "Unhandled event type" });
    }

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const subscriptionPaymentHandler = asyncWrapper(async (req: Request, res: Response) => {
  const { meta, data } = req.body;

  if (!meta?.event_name || !data?.attributes) {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  const { event_name } = meta;
  const attributes = data.attributes;

  const subscription = await prisma.subscription.findFirst({
    where: { id: `${attributes.subscription_id}` },
  });

  if (!subscription) {
    return res.status(404).json({ error: "subscription with that id not found" });
  }

  try {
    switch (event_name) {
      case "subscription_payment_success": {
        await logPaymentMsg({ email: subscription.email }, event_name);

        // Create/update notifier for payment success
        await prisma.notifier.create({
          data: {
            userId: subscription.userId,
            email: subscription.email,
            notifyType: "subscription_payment_success",
            notify: new Date(),
          },
        });
        break;
      }
      case "subscription_payment_failed": {

        // Update the user's subscription details on successful payment
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            plan: "free",
            ExpirationSubscription: null,
          },
        });

        await logPaymentMsg({ email: subscription.email }, event_name);

        // Create/update notifier for payment failure
        await prisma.notifier.create({
          data: {
            userId: subscription.userId,
            email: subscription.email,
            notifyType: "subscription_payment_failed",
            notify: new Date(),
          },
        });
        break;
      }
      case "subscription_payment_refunded": {
        await logPaymentMsg({ email: subscription.email }, event_name);

        // Create/update notifier for payment refunded
        await prisma.notifier.create({
          data: {
            userId: subscription.userId,
            email: subscription.email,
            notifyType: "subscription_payment_refunded",
            notify: new Date(),
          },
        });
        break;
      }
      default:
        console.warn(`Unhandled event type: ${event_name}`);
        return res.status(400).json({ message: "Unhandled event type" });
    }

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});