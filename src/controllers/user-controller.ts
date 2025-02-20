import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { hash } from "bcryptjs";
import { asyncWrapper } from "@/middleware/asyncWrapper";

const prisma = new PrismaClient();

/**
 * Get a single user by ID.
 */
export const getUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
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
  async (req: Request, res: Response, next: NextFunction) => {
    // Default pagination parameters
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offsetNum = (pageNum - 1) * limitNum;

    // Build query filter (search by email or mName)
    const query: any = {};
    if (search) {
      // Escape special characters in the search string
      const escapedSearch = search
        .toString()
        .replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&");
      query.OR = [
        { email: { contains: escapedSearch, mode: "insensitive" } },
        { mName: { contains: escapedSearch, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: query,
      skip: offsetNum,
      take: limitNum,
      orderBy: { date: "desc" },
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
 * Create a new user.
 */
export const createUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      email,
      mName,
      password,
      type,
      plan,
      signUpApp,
      refUserMail,
      country,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ errorMsg: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ errorMsg: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create user record
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        mName,
        password: hashedPassword,
        type: type || "free",
        plan: plan || "hobby",
        signUpApp: signUpApp || "AITeacher",
        refUserMail,
        country,
        // emailToken, emailTokenExpires, reset tokens etc. can be set later as needed
      },
    });

    res.status(201).json({
      success: `User ${newUser.email} created successfully!`,
      user: newUser,
    });
  }
);

/**
 * Update an existing user.
 */
export const updateUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { email, mName, password, country } = req.body;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).json({ errorMsg: "User not found" });
    }

    // Hash new password if provided; otherwise retain the existing hash
    const hashedPassword = password ? await hash(password, 10) : user.password;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email,
        mName,
        password: hashedPassword,
        country,
      },
    });

    res.status(200).json({
      success: `User ${updatedUser.email} updated successfully!`,
      user: updatedUser,
    });
  }
);

/**
 * Delete a user.
 * Note: Deletion should be allowed only for admin users per your policy.
 */
export const deleteUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).json({ errorMsg: "User not found" });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      success: `User ${user.email} deleted successfully!`,
    });
  }
);