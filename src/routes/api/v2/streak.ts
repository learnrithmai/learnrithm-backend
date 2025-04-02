import {
  GetStreakHandler,
  StreakHandler,
} from "@/controllers/streak-controller";
import { Router } from "express";

const router = Router({ mergeParams: true });

/* Configure the Routes */
router.post("/streak", StreakHandler);

router.post("/streakStatus", GetStreakHandler);

export default router;