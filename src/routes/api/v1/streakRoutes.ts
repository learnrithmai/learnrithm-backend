import express from "express";
import { upsertStreak, fetchStreakStatus } from "@/controllers/streakController";

const streakRouter = express.Router();

// Route to update streak


streakRouter.post("/upsert", (req, res, next) => {
  console.log("✅ Received POST request to /streaks/upsert");
  next();
});

streakRouter.post("/upsert", upsertStreak);   


console.log("✅ Streak routes loaded");

// Route to get streak status
streakRouter.get("/status/:userId", fetchStreakStatus);

export default streakRouter;
