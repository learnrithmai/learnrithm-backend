// Project: Payment
// Zhouzhou, Backend Intern Team

import { createPayment } from "@/controllers/payment-controller";
import { addSubscription } from "@/payment/paymentService";
import { Subscription } from "@lemonsqueezy/lemonsqueezy.js";
import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

/* Configure the Routes */
router.post("/test", (req: Request, res: Response) => {
  createPayment(req, res);
});

router.post("/webhook", (req: Request, res: Response) => {
  const data: Subscription = req.body;
  const orderName = data.data.attributes.product_name;
  const orderVariant = data.data.attributes.variant_name;
  const email = data.data.attributes.user_email;
  const dataToAdd = {
    email: email,
    orderName: orderName,
    orderVariant: orderVariant,
  };
  addSubscription(dataToAdd);
  res.status(200).json({ message: "Successful inserting new subscription." });
});

export default router;
