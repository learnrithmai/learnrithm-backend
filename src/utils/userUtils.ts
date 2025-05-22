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

export const getUserSubscriptions = async (subscriptions: SubscriptionInvoice[]): Promise<SubscriptionProfile[]> => {

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptions[0].subscriptionId } });

  if (!subscription) return []

  return subscriptions.map((sub) => ({
    subscriptionId: sub.subscriptionId,
    orderId: sub.id,

    status: sub.status,
    product: sub.product,

    cardBrand: subscription.cardBrand ?? undefined,
    cardLastFour: subscription.cardLastFour ?? undefined,

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
    subscriptionEndAt: new Date(currentSubscription.subscriptionEndAt),    billingReason: currentSubscription.billingReason
  } : undefined;
}

/**
 * Converts a database user to the format expected by token functions
 * Ensures type compatibility for token generation functions
 */
export function toUserInterface(dbUser: any): {
  id: string;
  name: string;
  email: string;
  method: string;
  lastLogin: Date | null;
  image: string | null;
  whoAreYou?: string;
  age?: number;
  birthDate?: Date;
  howDidYouFindUs?: string;
  plan?: string;
} {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    method: dbUser.method,
    lastLogin: dbUser.lastLogin,
    image: dbUser.image,
    plan: dbUser.plan || 'free',
    // Convert null to undefined for whoAreYou to match interface requirements
    whoAreYou: dbUser.whoAreYou === null ? undefined : dbUser.whoAreYou,
    age: dbUser.age === null ? undefined : dbUser.age,
    birthDate: dbUser.birthDate === null ? undefined : dbUser.birthDate,
    howDidYouFindUs: dbUser.howDidYouFindUs || undefined
  };
}