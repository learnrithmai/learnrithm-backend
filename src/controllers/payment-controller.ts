/* Controller of Payment Service */
// Testing
// Zhouzhou, backend intern team

import {
  createCheckoutData,
  createTransaction,
  getTransactionByEmail,
  searchProduct,
  updateTransaction,
} from "@/payment/paymentService";
import { CheckoutUrlInfo, TransactionData } from "@/types/transaction";
import { Request, Response } from "express";
import { LocalProduct, Transaction } from "@prisma/client";
import { Subscription } from "@lemonsqueezy/lemonsqueezy.js";

export const createPayment = async (req: Request, res: Response) => {
  // No Request Data
  if (!req.body) {
    return res
      .status(400)
      .json({ error: "Request body is empty. Create payment failed." });
  }

  // Get Request Data
  const data: CheckoutUrlInfo = req.body;

  // Get Product
  const product: LocalProduct | null = await searchProduct(
    data.orderName,
    data.orderVariant
  );

  // Product not found
  if (!product) {
    return res
      .status(400)
      .json({ error: "Order Name invalid. Create payment failed." });
  }

  // Create Checkout URL
  const url: string | null = await createCheckoutData(product.variantId, data);

  // Failed create URL
  if (!url) {
    return res.status(400).json({ error: "Failed to create Checkout URL." });
  }

  // Create URL successful
  res
    .status(200)
    .json({ message: "Checkout URL created successfully.", url: url });
};

export const processWebhook = async (req: Request, res: Response) => {
  // Get basic information
  const subscription: Subscription = req.body;
  const email: string = subscription.data.attributes.user_email;
  const product: string = subscription.data.attributes.product_name;
  const variant: string = subscription.data.attributes.variant_name;
  // Check if user exists
  let thisTransaction: Transaction | null = await getTransactionByEmail(email);
  if (thisTransaction) {
    thisTransaction.orderName = product;
    thisTransaction.orderVariant = variant;
    thisTransaction.duration = "Not determined";
    thisTransaction.subscriptionStart = new Date();
    thisTransaction.subscriptionEnd = new Date(2025, 11, 1);
    thisTransaction.freeTrial = false;
    thisTransaction.refunded = false;
    const response: Transaction = await updateTransaction(thisTransaction);
    return res.status(200).json({ message: response });
  } else {
    const newTransaction: TransactionData = {
      email: email,
      orderName: product,
      orderVariant: variant,
      duration: "Not determined",
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(2025, 11, 1),
      freeTrial: true,
      refunded: false,
    };
    const response: Transaction = await createTransaction(newTransaction);
    return res.status(200).json({ message: response });
  }
};
