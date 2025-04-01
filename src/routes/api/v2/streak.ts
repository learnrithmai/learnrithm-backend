import { login_streak } from "@/controllers/streak-controller";
import { Request, Response, Router } from "express";

const router = Router();

/* Configure the Routes */
router.post("/streak", (req: Request, res: Response) => {
  login_streak(req, res);
});

export default router;
