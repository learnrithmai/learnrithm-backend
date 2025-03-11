import { Request, Response } from "express";
import { hash } from "bcryptjs";
import { asyncWrapper } from "@/middleware/asyncWrapper";
import prisma from "@/config/db/prisma";
/**
 * Get a single user by ID.
 */
export const getUser = asyncWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ errorMsg: "User not found" });
    }

    res.status(200).json({
      success: `User ${user.email} fetched successfully!`,
      user,
    });
  }
);

/**
 * Get all users with optional pagination and search.
 */
export const getAllUsers = asyncWrapper(
  async (req: Request, res: Response) => {
    // Default pagination parameters
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offsetNum = (pageNum - 1) * limitNum;

    // Build query filter (search by email or firstName)
    const query: { OR?: { email?: { contains: string, mode: "insensitive" }, firstName?: { contains: string, mode: "insensitive" } }[] } = {};
    if (search) {
      const escapedSearch = search
        .toString()
        .replace(/[$()*+.?[\\\]^{|}]/g, "\\$&");
      query.OR = [
        { email: { contains: escapedSearch, mode: "insensitive" } },
        { firstName: { contains: escapedSearch, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: query,
      skip: offsetNum,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    });

    const totalUsers = await prisma.user.count({ where: query });

    if (!users || users.length === 0) {
      return res.status(404).json({ errorMsg: "No users found" });
    }

    res.status(200).json({
      success: "Users fetched successfully!",
      data: {
        total_users: totalUsers,
        users,
      },
    });
  }
);

/**
 * Update an existing user.
 * Updates the User record and, if provided, the password in the UserAuth record.
 */
export const updateUser = asyncWrapper(
  async (req: Request, res: Response) => {
    const { updateType } = req.params;
    //Update By Type
    if (updateType === "UpdateInfo") {

      const { name, lastLogin, imgThumbnail, plan, id, ExpirationSubscription, birthDate, phoneNumber, institution, linkedin, instagram, facebook, x } = req.body;

      // Check if the user ID is provided
      if (!id) {
        return res.status(400).json({ errorMsg: "User ID is required" });
      }

      // Check if there is any data to update
      if (!name && !lastLogin && !imgThumbnail && !plan && !ExpirationSubscription) {
        return res.status(400).json({ errorMsg: "No data to update" });
      }

      //check the plan with Expiration date
      if (plan && !ExpirationSubscription) {
        return res.status(400).json({ errorMsg: "Expiration Subscription is required" });
      }

      // Check if the user exists in the User model
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        return res.status(404).json({ errorMsg: "User not found" });
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
            ExpirationSubscription: ExpirationSubscription,
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
            ExpirationSubscription: ExpirationSubscription,
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
        success: `User ${user.email} updated successfully`
      });

    } else if (updateType === "UpdatePassword") {
      const { id, password } = req.body;

      // Check if the user ID is provided
      if (!id) {
        return res.status(400).json({ errorMsg: "User ID is required" });
      }

      // Check if the password is provided
      if (!password) {
        return res.status(400).json({ errorMsg: "Password is required" });
      }

      // Check if the user exists in the UserAuth model
      const userCredentials = await prisma.user.findUnique({
        where: { id },
      });

      if (!userCredentials) {
        return res.status(404).json({ errorMsg: "User not found" });
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
  }
);