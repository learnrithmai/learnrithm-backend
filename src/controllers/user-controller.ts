import { Request, Response, NextFunction } from "express";
import { hash } from "bcryptjs";
import prisma from "@/config/db/prisma";

/**
 * Get a single user by ID.
 */
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
};

/**
 * Update an existing user.
 * Supports two update types:
 *   - "UpdateInfo": Update general user information.
 *   - "UpdatePassword": Update the user's password.
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { updateType } = req.params;

    if (updateType === "UpdateInfo") {
      const {
        id,
        name,
        lastLogin,
        imgThumbnail,
        plan,
        ExpirationSubscription,
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
        !plan &&
        !ExpirationSubscription &&
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

      // If plan is provided, then ExpirationSubscription must be provided as well
      if (plan && !ExpirationSubscription) {
        res.status(400).json({
          errorMsg: "Expiration Subscription is required when updating plan",
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

      // Update the merged user record
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          Name: name ?? user.Name,
          lastLogin: lastLogin ?? user.lastLogin,
          imgThumbnail: imgThumbnail ?? user.imgThumbnail,
          plan: plan ?? user.plan,
          ExpirationSubscription:
            ExpirationSubscription ?? user.ExpirationSubscription,
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
    } else if (updateType === "UpdatePassword") {
      const { id, password } = req.body;

      // Validate input
      if (!id) {
        res.status(400).json({ errorMsg: "User ID is required" });
        return;
      }
      if (!password) {
        res.status(400).json({ errorMsg: "Password is required" });
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

      // Hash the new password
      const hashedPassword = await hash(password, 10);

      // Update the password field in the merged user model
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      res.status(200).json({
        success: `User ${updatedUser.email} password updated successfully`,
      });
    }
  } catch (error) {
    next(error);
  }
};
