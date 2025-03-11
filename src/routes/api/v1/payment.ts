// Porject: Payment
// Zhouzhou, Backend Intern Team

//import express, { Router } from "express";
import { PrismaClient, Transaction, Product } from "@prisma/client";

export class PaymentService {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    // Connect to DataBase
    this.prisma = prisma;
  }

  // Method to create a new transaction in DataBase
  async createTransaction(data: {
    email: string;
    duration: string;
    subscriptionStart: Date;
    subscriptionEnd: Date;
    orderId: string;
    refunded: boolean;
    freeTrial: boolean;
  }): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }

  // Method to search a transaction in DataBase
  async getTransactionById(id: string): Promise<Transaction | null> {
    if (id.length == 0) {
      throw new Error("Provided id is empty.");
    }
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  async getTransactionByEmail(email: string): Promise<Transaction | null> {
    if (email.length == 0) {
      throw new Error("Provided email is empty.");
    }
    return prisma.transaction.findUnique({
      where: { email },
    });
  }

  // Method to register a new product in DataBase
  async createProduct(data: {
    name: string;
    nameId: string;
    variant: string;
    variantId: string;
    freeTrailAmount: number;
  }): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  // Method to search a product in DataBase
  async searchProductByName(name: string): Promise<Product | null> {
    if (name.length == 0) {
      throw new Error("Provided Porduct Name is empty");
    }

    return prisma.product.findUnique({
      where: { name },
    });
  }
}

const prisma = new PrismaClient();
//const payment: PaymentService = new PaymentService(prisma);

//const router: Router = express.Router();

//router.post("/api/payment/create", createPaymentModel);

//router.post("/api/payment/create", returnWebhook);

//router.get("/api/payment/status", checkStatus);

export default PaymentService;
