// Project: Payment
// Zhouzhou, Backend Intern Team

import {
  createPayment,
  getPaymentStatus,
  processWebhook,
} from "@/controllers/payment-controller";
import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

/* Configure the Routes */
router.post("/api/v1/createUrl", (req: Request, res: Response) => {
  createPayment(req, res);
});

router.post("api/v1/webhook", (req: Request, res: Response) => {
  processWebhook(req, res);
});

router.post("api/v1/checkStatus", (req: Request, res: Response) => {
  getPaymentStatus(req, res);
});

export default router;
