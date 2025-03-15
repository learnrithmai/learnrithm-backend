import { Request, Response, NextFunction } from "express";
import { hash } from "bcryptjs";
import prisma from "@/config/db/prisma";

/**
 * Get a single user by ID.
 */
export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
 * Updates the User record and, if provided, the password in the UserAuth record.
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { updateType } = req.params;
    // Update By Type
    if (updateType === "UpdateInfo") {
      const {
        name,
        lastLogin,
        imgThumbnail,
        plan,
        id,
        ExpirationSubscription,
        birthDate,
        phoneNumber,
        institution,
        linkedin,
        instagram,
        facebook,
        x,
      } = req.body;

      // Check if the user ID is provided
      if (!id) {
        res.status(400).json({ errorMsg: "User ID is required" });
        return;
      }

      // Check if there is any data to update
      if (!name && !lastLogin && !imgThumbnail && !plan && !ExpirationSubscription) {
        res.status(400).json({ errorMsg: "No data to update" });
        return;
      }

      // Check the plan with Expiration date
      if (plan && !ExpirationSubscription) {
        res.status(400).json({ errorMsg: "Expiration Subscription is required" });
        return;
      }

      // Check if the user exists in the User model
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        res.status(404).json({ errorMsg: "User not found" });
        return;
      }

      if (plan || imgThumbnail || name) {
        // Update the User record
        await prisma.userInfo.update({
          where: { id },
          data: {
            Name: name,
            lastLogin,
            imgThumbnail,
            plan,
          },
        });

        await prisma.userDetails.update({
          where: { id },
          data: {
            Name: name,
            lastLogin,
            imgThumbnail,
            plan,
            ExpirationSubscription,
            phoneNumber,
            birthDate,
            institution,
            linkedin,
            instagram,
            facebook,
            x,
          },
        });
      } else {
        await prisma.userDetails.update({
          where: { id },
          data: {
            ExpirationSubscription,
            phoneNumber,
            birthDate,
            institution,
            linkedin,
            instagram,
            facebook,
            x,
          },
        });
      }

      res.status(200).json({
        success: `User ${user.email} updated successfully`,
      });
    } else if (updateType === "UpdatePassword") {
      const { id, password } = req.body;

      // Check if the user ID is provided
      if (!id) {
        res.status(400).json({ errorMsg: "User ID is required" });
        return;
      }

      // Check if the password is provided
      if (!password) {
        res.status(400).json({ errorMsg: "Password is required" });
        return;
      }

      // Check if the user exists in the UserAuth model
      const userCredentials = await prisma.user.findUnique({
        where: { id },
      });
      if (!userCredentials) {
        res.status(404).json({ errorMsg: "User not found" });
        return;
      }

      // Hash the password
      const hashedPassword = await hash(password, 10);

      // Update the UserAuth record
      const updatedUserCredentials = await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
      });

      res.status(200).json({
        success: `User ${updatedUserCredentials.email} password updated successfully`,
      });
    }
  } catch (error) {
    next(error);
  }
};