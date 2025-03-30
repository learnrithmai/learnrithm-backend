/* Controller of Payment Service */
// Testing
// Zhouzhou, backend intern team

import {
  createCheckoutData,
  getTransactionByEmail,
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
import { asyncWrapper } from "@/middleware/asyncWrapper";

export const createPayment = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    // No Request Data
    if (!req.body) {
      res
        .status(400)
        .json({ error: "Request body is empty. Create payment failed." });
      return;
    }

    // Get Request Data
    const data: CheckoutUrlInfo = req.body;
    if (!data.email || !data.orderName || !data.orderVariant) {
      res.status(400).json({
        error: "Missing fields of request body.",
        Usage: "{email: string, orderName:string, orderVariant:string}",
      });
      return;
    }
    // Get Product
    const product: LocalProduct | null = await searchProductDatabase(
      data.orderName,
      data.orderVariant
    );

    // Product not found
    if (!product) {
      const products = await listProductDatabase();
      res.status(400).json({
        error: "Order Name invalid. Create payment failed.",
        AvailableProducts: products,
      });
      return;
    }

    // Create Checkout URL
    const url: string | null = await createCheckoutData(product.variantId, data);

    // Failed create URL
    if (!url) {
      res.status(400).json({ error: "Failed to create Checkout URL." });
      return;
    }

    // Return URL
    res
      .status(200)
      .json({ message: "Checkout URL created successfully.", url: url });
  });

export const processWebhook = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    // Get the subscription
    const subscription: Subscription | null = req.body;
    const metaDataCopy = req.body;
    if (!subscription) {
      res.status(400).json({ error: "Failed to receive subscription!" });
      return;
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
      res.status(400).json({
        error:
          "Product data in Lemon Squeezy and Local DataBase is not sync! Try run syncProducts().",
      });
      return;
    }
    // Case1: New User
    if (metaDataCopy.meta.event_name === LemonWebhook.Subscription_Create) {
      // Process the transaction
      const response: Transaction | null = await processNewUser(
        subscription,
        variant
      );
      // Process failed
      if (!response) {
        res.status(400).json({
          error:
            "Can not process transaction. User already exists or Products data not sync",
        });
        return;
      }
      // Process successfully
      res
        .status(200)
        .json({ message: "Create transaction for new user", data: response });
      return;
    }

    // Case2: Exsiting User and Update the subscription
    if (metaDataCopy.meta.event_name === LemonWebhook.Subscription_Update) {
      // Process the transaction
      const response: Transaction | null = await processExsitingUser(
        subscription,
        variant
      );
      if (!response) {
        res.status(400).json({
          error:
            "Can not process transaction. User doesn't exist or Product not valid.",
        });
        return;
      }

      res.status(200).json({
        message: "Updated transaction for existing user",
        data: response,
      });
      return;
    }

    // Case3: Existing User, cancelled the subscription

    // No operation on any other subscription type
    res.status(200).json({ message: "Successfully received subscription." });
  }
);

export const getPaymentStatus = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    // Get Payment Detail from Request
    const email: string | null = req.body.email;
    if (!email) {
      res.status(400).json({ error: "No Email received" });
      return;
    }
    // Get Transaction
    const transaction: Transaction | null = await getTransactionByEmail(email);
    if (!transaction) {
      res.status(400).json({ error: "Payment Detail Notfound" });
      return;
    }
    res.status(200).json({ message: transaction });
    return;
  });
