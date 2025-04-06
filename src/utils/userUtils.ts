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


export const getCurrentSubscription = (subscriptions: SubscriptionInvoice[]): SubscriptionProfile | undefined => {
  const currentSubscription = subscriptions.find((sub) => sub.status === "paid" || sub.status === "on_trial");
  return currentSubscription ? {
    subscriptionId: currentSubscription.subscriptionId,
    orderId: currentSubscription.id,

    status: currentSubscription.status,
    product: currentSubscription.product,

    cardBrand: currentSubscription.cardBrand || undefined,
    cardLastFour: currentSubscription.cardLastFour || undefined,

    subscriptionStartAt: new Date(currentSubscription.subscriptionStartAt),
    subscriptionEndAt: new Date(currentSubscription.subscriptionEndAt),

    billingReason: currentSubscription.billingReason
  } : undefined;
}