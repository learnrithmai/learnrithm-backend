import { CheckoutUrlInfo, TransactionData } from "@/types/transaction";
import { PrismaClient, LocalProduct, Transaction } from "@prisma/client";
import {
  getAuthenticatedUser,
  lemonSqueezySetup,
  NewCheckout,
  createCheckout,
  getVariant,
  Variant,
  Product,
  getProduct,
  listVariants,
  ListVariants,
  Subscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import { addMonthsUtil, addYearsUtil } from "@/utils/paymentUtils";

/* Configuration */
const prisma = new PrismaClient();
const lemon_key = process.env.LEMON_KEY;
// Change this to your own shop ID
const store_id = 161228;
// Set up the Lemon Squeezy
lemonSqueezySetup({
  apiKey: lemon_key,
  onError: (error) => console.error("Error!", error),
});

// Create transaction
export const createTransaction = async (
  data: TransactionData
): Promise<Transaction> => {
  return prisma.transaction.create({ data });
};

// Update transaction
export const updateTransaction = async (
  data: Transaction
): Promise<Transaction> => {
  return prisma.transaction.update({
    where: { email: data.email },
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

// Process Transaction for new User
export const processNewUser = async (
  subscription: Subscription,
  variant: LocalProduct
): Promise<Transaction | null> => {
  // Get Email and check if user already exists
  const email: string = subscription.data.attributes.user_email;
  if (await isUserExist(email)) {
    return null;
  }
  // Calculate Start Date and End Date
  const startDate: Date = new Date();
  const trialEndTime: string | null =
    subscription.data.attributes.trial_ends_at;
  if (!trialEndTime) {
    return null;
  }
  const endDate: Date = new Date(trialEndTime);
  // Construct the data
  const transactionData: TransactionData = {
    orderName: variant.name,
    orderVariant: variant.variant,
    subscriptionStart: startDate,
    subscriptionEnd: endDate,
    email: email,
    duration: variant.interval,
    refunded: false,
    freeTrial: true,
  };
  // Create the transaction
  return await createTransaction(transactionData);
};

// Create a product in database
export const createProductDatabase = async (
  data: Variant["data"]
): Promise<LocalProduct | null> => {
  // Get Product Object
  const product: Product | null = await searchProductLemon(
    data.attributes.product_id
  );
  if (!product) {
    return null;
  }
  // Get the data needed to create the LocalProduct
  const productName: string = product.data.attributes.name;
  const productId: string = product.data.id;
  const variantName: string = data.attributes.name;
  const variantId: string = data.id;
  const interval: string | null = data.attributes.interval;
  const price: number = data.attributes.price;
  const freeTrialAmount: number = data.attributes.trial_interval_count;
  if (!interval) {
    return null;
  }
  // Create the new LocalProduct
  const response: LocalProduct | null = await prisma.localProduct.create({
    data: {
      name: productName,
      nameId: productId,
      variant: variantName,
      variantId: variantId,
      interval: interval,
      price: price,
      freeTrailAmount: freeTrialAmount,
    },
  });

  // Return the LocalProduct
  return response;
};

// Sync all the products from LemonSqueezy
export const syncProducts = async () => {
  // Clear the database
  await prisma.localProduct.deleteMany({});
  // Get every variant of every product
  const data: ListVariants | null = (await listVariants()).data;
  if (!data) {
    return null;
  }
  // Insert into the databse
  for (const variant of data.data) {
    const response: LocalProduct | null = await createProductDatabase(variant);
    console.log(response);
  }
  console.log("Products Data Sync Successfully.");
};

// Search a product in database
export const searchProductDatabase = async (
  name: string,
  variant: string
): Promise<LocalProduct | null> => {
  return prisma.localProduct.findUnique({
    where: {
      name_variant: {
        name,
        variant,
      },
    },
  });
};

// Show all the product in database
export const listProductDatabase = async (): Promise<
  { name: string; variant: string }[]
> => {
  return prisma.localProduct.findMany({
    select: {
      name: true,
      variant: true,
    },
  });
};

export const searchVariantLemon = async (
  id: string | number
): Promise<Variant | null> => {
  return (await getVariant(id)).data;
};

export const searchProductLemon = async (
  id: string | number
): Promise<Product | null> => {
  return (await getProduct(id)).data;
};

// Configure LemonSqueezy
export const LemonSq = async () => {
  const { data, error } = await getAuthenticatedUser();

  if (error) {
    console.log(error.message);
  } else {
    console.log(data);
  }
};

// Create Checkout URL
export const createCheckoutData = async (
  variantId: string,
  data: CheckoutUrlInfo
): Promise<string | null> => {
  const newCheckout: NewCheckout = {
    productOptions: {
      name: data.orderName,
      description: "to be confirmed",
    },
    checkoutOptions: {
      embed: true,
      media: true,
      logo: true,
    },
    checkoutData: {
      email: data.email,
      name: "test_customer",
      custom: {},
    },
    expiresAt: null,
    preview: true,
    testMode: true,
  };

  const checkoutData = await createCheckout(store_id, variantId, newCheckout);

  if (!checkoutData) {
    return null;
  }

  const url: string | undefined = checkoutData.data?.data.attributes.url;
  if (url === undefined) {
    return null;
  }
  return url;
};

// Calculate the End date of the subscription
export const getEndDate = (
  interval: string,
  startDate: Date,
  count: number
): Date | null => {
  let endDate: Date;
  if (interval === "year") {
    endDate = addYearsUtil(startDate, count);
    return endDate;
  } else if (interval === "month") {
    endDate = addMonthsUtil(startDate, count);
    return endDate;
  } else {
    return null;
  }
};
