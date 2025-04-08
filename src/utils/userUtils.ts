import prisma from "@/config/db/prisma";
import { SubscriptionInvoice } from "@prisma/client";

type SubscriptionProfile = {
  subscriptionId: string;
  orderId: string;

  status: string;
  product: string;

  cardBrand?: string;
  cardLastFour?: string;

  subscriptionStartAt: Date;
  subscriptionEndAt: Date;

  billingReason: string;
};

export const getUserSubscriptions = (subscriptions: SubscriptionInvoice[]): SubscriptionProfile[] => {
  return subscriptions.map((sub) => ({
    subscriptionId: sub.subscriptionId,
    orderId: sub.id,

    status: sub.status,
    product: sub.product,

    cardBrand: sub.cardBrand || undefined,
    cardLastFour: sub.cardLastFour || undefined,

    subscriptionStartAt: new Date(sub.subscriptionStartAt),
    subscriptionEndAt: new Date(sub.subscriptionEndAt),

    billingReason: sub.billingReason
  }));
};


export const getCurrentSubscription = async (subscriptions: SubscriptionInvoice[]): Promise<SubscriptionProfile | undefined> => {
  const currentSubscription = subscriptions.find((sub) => sub.status === "paid" || sub.status === "on_trial");

  const subscription = await prisma.subscription.findUnique({ where: { id: currentSubscription?.subscriptionId } });

  if (!subscription) return undefined

  return currentSubscription ? {
    subscriptionId: currentSubscription.subscriptionId,
    orderId: currentSubscription.id,

    status: currentSubscription.status,
    product: currentSubscription.product,

    cardBrand: subscription.cardBrand ?? "visa",
    cardLastFour: subscription.cardLastFour ?? "9999",

    subscriptionStartAt: new Date(currentSubscription.subscriptionStartAt),
    subscriptionEndAt: new Date(currentSubscription.subscriptionEndAt),

    billingReason: currentSubscription.billingReason
  } : undefined;
}