/* Controller of Payment Service */
// Testing
// Zhouzhou, backend intern team

import {
  createTransaction,
  searchProduct,
  updateTransaction,
} from "@/payment/paymentService";
import { TransactionData } from "@/types/transaction";
import { Request, Response } from "express";
import { isUserExist } from "../payment/paymentService";
import { Product } from "@prisma/client";

export const createPayment = async (req: Request, res: Response) => {
  // No Request Data
  if (!req.body) {
    return res
      .status(400)
      .json({ error: "Request body is empty. Create payment failed." });
  }

  // Get Request Data
  const data: TransactionData = req.body;

  // Get Product
  const product: Product | null = await searchProduct(
    data.orderName,
    data.orderVariant
  );

  // Product not found
  if (!product) {
    return res
      .status(400)
      .json({ error: "Order Name invalid. Create payment failed." });
  }

  // Check if User is already registered
  const exist: boolean = await isUserExist(data.email);

  if (exist) {
    // For existing user, update his/her information
    updateTransaction(data, data.email);
  } else {
    // For non-existing user, create a new transaction
    createTransaction(data);
  }

  return res.status(201).json({
    message: "Payment created successfully.",
  });
};
