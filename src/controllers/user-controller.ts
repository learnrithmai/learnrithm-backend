import { Request, Response, NextFunction } from "express";
import { hash } from "bcryptjs";
import prisma from "@/config/db/prisma";
import { asyncWrapper } from "@/middleware/asyncWrapper";

/**
 * Get a single user by ID.
 */

export const getUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.params;

      console.log(email);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(404).json({ errorMsg: "User not found" });
        return;
      }

      res.status(200).json({
        success: `User ${user.email} fetched successfully!`,
        user,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Update an existing user information
 */

export const updateUserInfo = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        id,
        name,
        lastLogin,
        imgThumbnail,
        birthDate,
        phoneNumber,
        institution,
        linkedin,
        instagram,
        facebook,
        x,
      } = req.body;

      // Validate that the user ID is provided
      if (!id) {
        res.status(400).json({ errorMsg: "User ID is required" });
        return;
      }

      // Check if there's data to update
      if (
        !name &&
        !lastLogin &&
        !imgThumbnail &&
        !birthDate &&
        !phoneNumber &&
        !institution &&
        !linkedin &&
        !instagram &&
        !facebook &&
        !x
      ) {
        res.status(400).json({ errorMsg: "No data to update" });
        return;
      }

      // Verify the user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        res.status(404).json({ errorMsg: "User not found" });
        return;
      }

      // Update the merged user record
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          Name: name ?? user.Name,
          lastLogin: lastLogin ?? user.lastLogin,
          imgThumbnail: imgThumbnail ?? user.imgThumbnail,
          birthDate: birthDate ?? user.birthDate,
          phoneNumber: phoneNumber ?? user.phoneNumber,
          institution: institution ?? user.institution,
          linkedin: linkedin ?? user.linkedin,
          instagram: instagram ?? user.instagram,
          facebook: facebook ?? user.facebook,
          x: x ?? user.x,
        },
      });

      res.status(200).json({
        success: `User ${updatedUser.email} updated successfully`,
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Update an existing user Password
 */

export const UpdateUserPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, password, newPassword } = req.body;

      // Validate input
      if (!id) {
        res.status(400).json({ errorMsg: "User ID is required" });
        return;
      }
      if (!password || !newPassword) {
        res.status(400).json({ errorMsg: "Passwords is required" });
        return;
      }

      // Verify the user exists
      const user = await prisma.user.findUnique({
        where: { id, method: "normal" },
        select: { password: true },
      });

      if (!user) {
        res.status(404).json({ errorMsg: "User not found" });
        return;
      }

      if (user?.password !== password) {
        res.status(400).json({ errorMsg: "Password is incorrect" });
        return;
      }

      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);

      // Update the password field in the merged user model
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      res.status(200).json({
        success: `User ${updatedUser.email} password updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Update an existing user Plan
 */

export const updateUserPlan = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, plan, ExpirationSubscription } = req.body;

      // Validate that the user ID is provided
      if (!id) {
        res.status(400).json({ errorMsg: "User ID is required" });
        return;
      }

      // If plan is provided, then ExpirationSubscription must be provided as well
      if (!plan || !ExpirationSubscription) {
        res.status(400).json({
          errorMsg:
            "plan and Expiration Subscription is required when updating user plan",
        });
        return;
      }

      // Verify the user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        res.status(404).json({ errorMsg: "User not found" });
        return;
      }

      // Update the user plan
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          plan: plan ?? user.plan,
          ExpirationSubscription:
            ExpirationSubscription ?? user.ExpirationSubscription,
        },
      });

      res.status(200).json({
        success: `User ${updatedUser.email}'s plan updated successfully`,
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },
);
