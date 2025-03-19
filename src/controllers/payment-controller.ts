/* Controller of Payment Service */
// Testing
// Zhouzhou, backend intern team

import {
  createCheckoutData,
  listProductDatabase,
  searchProductDatabase,
} from "@/payment/paymentService";
import { CheckoutUrlInfo } from "@/types/transaction";
import { Request, Response } from "express";
import { LocalProduct } from "@prisma/client";
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
  // Get the receipt
  const subscription: Subscription | null = req.body;
  if (!subscription) {
    return res.status(400).json({ error: "Failed to receive subscription!" });
  }

  res.status(200).json({ message: "Successfully received subscription." });
};
