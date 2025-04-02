import {
  GetStreakHandler,
  StreakHandler,
} from "@/controllers/streak-controller";
import { Request, Response, Router } from "express";

const router = Router();

/* Configure the Routes */
router.post("/streak", (req: Request, res: Response) => {
  StreakHandler(req, res);
});

router.post("/streakStatus", (req: Request, res: Response) => {
  GetStreakHandler(req, res);
});

export default router;
