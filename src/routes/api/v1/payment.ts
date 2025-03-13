// Project: Payment
// Zhouzhou, Backend Intern Team

import {
  createPayment,
  processWebhook,
} from "@/controllers/payment-controller";
import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

/* Configure the Routes */
router.post("/createUrl", (req: Request, res: Response) => {
  createPayment(req, res);
});

router.post("/webhook", (req: Request, res: Response) => {
  processWebhook(req, res);
});

export default router;
