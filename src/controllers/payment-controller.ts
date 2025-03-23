/* Controller of Payment Service */
// Testing
// Zhouzhou, backend intern team

import {
  createCheckoutData,
  listProductDatabase,
  processExsitingUser,
  processNewUser,
  searchProductDatabase,
} from "@/payment/paymentService";
import { CheckoutUrlInfo } from "@/types/transaction";
import { Request, Response } from "express";
import { LocalProduct, Transaction } from "@prisma/client";
import { Subscription } from "@lemonsqueezy/lemonsqueezy.js";
import { LemonWebhook } from "@/payment/subscription_enum";

export const createPayment = async (req: Request, res: Response) => {
  // No Request Data
  if (!req.body) {
    return res
      .status(400)
      .json({ error: "Request body is empty. Create payment failed." });
  }

  // Get Request Data
  const data: CheckoutUrlInfo = req.body;
  if (!data.email || !data.orderName || !data.orderVariant) {
    return res.status(400).json({
      error: "Missing fields of request body.",
      Usage: "{email: string, orderName:string, orderVariant:string}",
    });
  }
  // Get Product
  const product: LocalProduct | null = await searchProductDatabase(
    data.orderName,
    data.orderVariant
  );

  // Product not found
  if (!product) {
    const products = await listProductDatabase();
    return res.status(400).json({
      error: "Order Name invalid. Create payment failed.",
      AvailableProducts: products,
    });
  }

  // Create Checkout URL
  const url: string | null = await createCheckoutData(product.variantId, data);

  // Failed create URL
  if (!url) {
    return res.status(400).json({ error: "Failed to create Checkout URL." });
  }

  // Return URL
  res
    .status(200)
    .json({ message: "Checkout URL created successfully.", url: url });
};

export const processWebhook = async (req: Request, res: Response) => {
  // Get the subscription
  const subscription: Subscription | null = req.body;
  const metaDataCopy = req.body;
  if (!subscription) {
    return res.status(400).json({ error: "Failed to receive subscription!" });
  }
  // Get the subscription detail
  const productName: string = subscription.data.attributes.product_name;
  const variantName: string = subscription.data.attributes.variant_name;
  const variant: LocalProduct | null = await searchProductDatabase(
    productName,
    variantName
  );
  // Check if Product exists
  if (!variant) {
    return res.status(400).json({
      error:
        "Product data in Lemon Squeezy and Local DataBase is not sync! Try run syncProducts().",
    });
  }
  // New User
  if (metaDataCopy.meta.event_name === LemonWebhook.Subscription_Create) {
    // Process the transaction
    const response: Transaction | null = await processNewUser(
      subscription,
      variant
    );
    // Process failed
    if (!response) {
      return res.status(400).json({
        error:
          "Can not process transaction. User already exists or Products data not sync",
      });
    }
    // Process successfully
    return res
      .status(200)
      .json({ message: "Create transaction for new user", data: response });
  }

  // Exsiting User: Update the subscription
  if (metaDataCopy.meta.event_name === LemonWebhook.Subscription_Update) {
    // Process the transaction
    const response: Transaction | null = await processExsitingUser(
      subscription,
      variant
    );
    if (!response) {
      return res.status(400).json({
        error:
          "Can not process transaction. User doesn't exist or Product not valid.",
      });
    }

    return res.status(200).json({
      message: "Updated transaction for existing user",
      data: response,
    });
  }
  // No operation on any other subscription type
  res.status(200).json({ message: "Successfully received subscription." });
};
