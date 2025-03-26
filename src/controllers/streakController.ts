import { Request, Response } from "express";
import { getStreakStatus, updateStreak } from "@/utils/streakService";

export const upsertStreak = async (req: Request, res: Response): Promise<void> => {
    const {userId, email, action} = req.body;

    if (!userId || !email || !action) {
        res.status(400).json({error: "Missing required fields"});
        return;
    }

    try {
        const updatedStreak = await updateStreak(userId, email, action);
        res.status(200).json({message: "Streak updated", data: updatedStreak})
        return;
    } catch (error) {
        res.status(500).json({message: "Failed to update streak"});
        return;
    }
}

export const fetchStreakStatus = async (req: Request, res: Response): Promise<void> => {
    const {userId} = req.params;

    if (!userId) {
        res.status(400).json({error: "User ID is required"});
        return;
    }

    try {
        const streak = await getStreakStatus(userId);
        
        if (!streak) {
            res.status(404).json({error: "No streak found for user"})
            return;
        }

        res.status(200).json(streak);
        return;
    } catch(error) {
        res.status(500).json({error: "Failed to fetch streak status"})
        return;
    }
}