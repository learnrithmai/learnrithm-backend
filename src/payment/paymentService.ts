import { TransactionData } from "@/types/transaction";
import { PrismaClient, Product, Transaction } from "@prisma/client";
import {
  getAuthenticatedUser,
  lemonSqueezySetup,
  createCustomer,
  type NewCustomer,
  NewCheckout,
  createCheckout,
  Checkout,
  createWebhook,
} from "@lemonsqueezy/lemonsqueezy.js";

// Configruation
const prisma = new PrismaClient();
const lemon_key = process.env.LEMON_KEY;
const store_id = 161228;
lemonSqueezySetup({
  apiKey: lemon_key,
  onError: (error) => console.error("Error!", error),
});

// Create transaction for new user
export const createTransaction = async (
  data: TransactionData
): Promise<Transaction> => {
  return prisma.transaction.create({ data });
};

// Update transaction for existing user
export const updateTransaction = async (
  data: TransactionData,
  email: string
): Promise<Transaction> => {
  return prisma.transaction.update({
    where: { email },
    data: {
      duration: data.duration,
      subscriptionStart: data.subscriptionStart,
      subscriptionEnd: data.subscriptionEnd,
      orderName: data.orderName,
      orderVariant: data.orderVariant,
      refunded: data.refunded,
      freeTrial: data.freeTrial,
    },
  });
};

// Get transaction by ID (in database)
export const getTransactionById = async (
  id: string
): Promise<Transaction | null> => {
  return prisma.transaction.findUnique({ where: { id } });
};

// Get transaction by User's email (unique field)
export const getTransactionByEmail = async (
  email: string
): Promise<Transaction | null> => {
  return prisma.transaction.findUnique({ where: { email } });
};

// Check if User exists
export const isUserExist = async (email: string): Promise<boolean> => {
  const transaction = await getTransactionByEmail(email);
  return transaction !== null;
};

// Get user's subscription type
export const getUserStatus = async (email: string): Promise<string | null> => {
  const transaction = await getTransactionByEmail(email);
  if (!transaction || transaction.subscriptionEnd < new Date()) {
    return null;
  }
  return transaction.orderName;
};

// Create a product in database
export const createProduct = async (data: {
  name: string;
  nameId: string;
  variant: string;
  variantId: string;
  freeTrailAmount: number;
}): Promise<Product> => {
  return prisma.product.create({ data });
};

// Update a product in database
export const updateProduct = async (data: {
  name: string;
  nameId: string;
  variant: string;
  variantId: string;
  freeTrailAmount: number;
}): Promise<Product | null> => {
  return prisma.product.update({
    where: {
      name_variant: { name: data.name, variant: data.variant },
    },
    data: {
      nameId: data.nameId,
      variantId: data.variantId,
      freeTrailAmount: data.freeTrailAmount,
    },
  });
};

// Search a product in database
export const searchProduct = async (
  name: string,
  variant: string
): Promise<Product | null> => {
  return prisma.product.findUnique({
    where: {
      name_variant: {
        name,
        variant,
      },
    },
  });
};

export const LemonSq = async () => {
  const { data, error } = await getAuthenticatedUser();

  if (error) {
    console.log(error.message);
  } else {
    console.log(data);
  }
};

export const addSubscription = async (data: {
  email: string;
  orderName: string;
  orderVariant: string;
}) => {
  prisma.subscription.create({ data });
};

export const createLemonUser = async (name: string, email: string) => {
  const newCustomer: NewCustomer = { name: name, email: email };
  return createCustomer(store_id, newCustomer);
};

export const createCheckoutData = async (
  email: string,
  variantId: string
): Promise<Checkout | null> => {
  const newCheckout: NewCheckout = {
    productOptions: {
      name: "Default Checkout",
      description: "Default Checkout Process",
    },
    checkoutOptions: {
      embed: true,
      media: true,
      logo: true,
    },
    checkoutData: {
      email: email,
      name: "test_customer",
    },
    expiresAt: null,
    preview: true,
    testMode: true,
  };

  const checkoutData = await createCheckout(store_id, variantId, newCheckout);
  return checkoutData.data;
};

export const lemonWebhook = async () => {
  return createWebhook(store_id, {
    url: "http://localhost:7998/webhook",
    events: ["subscription_created", "subscription_cancelled"],
    secret: "LEARNRITHM",
  });
};
