import { Subscription } from "@prisma/client";

type SubscriptionProfile = {
  subscriptionId: string;
  status: string;
  trialEndsAt?: Date;
  cardBrand: string;
  cardLastFour: string;
  subscriptionStartAt: Date;
  subscriptionRenewsAt: Date;
  product: string;
};

export const getUserSubscriptions = (subscriptions: Subscription[]): SubscriptionProfile[] => {
  return subscriptions.map((sub) => ({
    subscriptionId: sub.id,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : undefined,
    cardBrand: sub.cardBrand,
    cardLastFour: sub.cardLastFour,
    subscriptionStartAt: new Date(sub.subscriptionStartAt),
    subscriptionRenewsAt: new Date(sub.subscriptionRenewsAt),
    product: sub.product,
  }));
};


export const getCurrentSubscription = (subscriptions: Subscription[]): SubscriptionProfile | undefined => {
  const currentSubscription = subscriptions.find((sub) => sub.status === "paid" || sub.status === "trialing");
  return currentSubscription ? {
    subscriptionId: currentSubscription.id,
    status: currentSubscription.status,
    trialEndsAt: currentSubscription.trialEndsAt ? new Date(currentSubscription.trialEndsAt) : undefined,
    cardBrand: currentSubscription.cardBrand,
    cardLastFour: currentSubscription.cardLastFour,
    subscriptionStartAt: new Date(currentSubscription.subscriptionStartAt),
    subscriptionRenewsAt: new Date(currentSubscription.subscriptionRenewsAt),
    product: currentSubscription.product,
  } : undefined;
}