import prisma from "@/config/db/prisma";
import { getCookieOptions } from "@/config/security/cookieOptions";
import { asyncWrapper } from "@/middleware/asyncWrapper";
import { generateUsername, isPasswordMatch, verifyEmail as verifyEmailUtil } from "@/utils/authUtils";
import log from "@/utils/chalkLogger";
import {
  sendResetPasswordEmail,
  sendSuccessResetPasswordEmail,
  sendVerificationEmail as sendVerificationEmailUtil,
} from "@/utils/emailUtils";
import {
  generateAccessToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  verifyToken,
} from "@/utils/tokenUtils";
import {
  ForgotPasswordBody,
  LoginBody,
  RegisterUserBody,
  ResetPasswordBody,
  ResetPasswordQuery,
  verifyEmailQuery,
} from "@/validations/authSchema";
import { TokenType, User, RoleType, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";

export const registerUser = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password, gender, birthDate, country, state, phone, riwaya } =
    req.body as RegisterUserBody;

  // Check for duplicate user by email
  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate) {
    return res.status(409).json({ error: "Email already in use" }); // Conflict
  }

  // Generate a unique username using firstName and lastName
  const username = generateUsername(firstName as string, lastName as string);

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password as string, 8);

  // Create a new user and student record in a transaction
  const user = await prisma.$transaction(async (tx: PrismaClient) => {
    const newUser = await tx.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        gender,
        birthDate,
        country,
        state,
        role: RoleType.STUDENT,
        phone,
        // ZenStack policies (declared in the Prisma schema) ensure that only allowed fields/operations succeed.
      },
    });

    await tx.student.create({
      data: {
        riwaya,
        userId: newUser.id,
      },
    });

    // Return the user along with the student relation
    return tx.user.findUnique({
      where: { id: newUser.id },
      include: { student: true },
    });
  });

  if (!user) {
    res.status(500).json({ error: "Student transaction creation failed" });
    return;
  }

  // Generate auth tokens (access and refresh tokens) and save refresh token in the DB.
  const tokens = await generateAuthTokens(user);
  res.status(201).json({
    success: `New student ${user.firstName} ${user.lastName} created!`,
    user,
    accessToken: tokens.access,
  });
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const { identifier, password } = req.body as LoginBody;

  // Verify user existence by email or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    include: {
      student: true,
      teacher: true,
      supervisor: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User with that email/username not found" });
    return;
  }

  // Verify password match
  if (!(await isPasswordMatch(password, user.password))) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  // Generate auth tokens (access and refresh tokens) and save the refresh token in the DB.
  const tokens = await generateAuthTokens(user);

  // Create a secure cookie with the refresh token
  res.cookie("jwt", tokens.refresh.token, getCookieOptions(tokens.refresh.expires));

  // Retrieve a safe user representation (excluding sensitive fields)
  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    // ZenStack policies ensure that sensitive data (like the password) is not returned.
  });

  res.send({
    success: `Login successful: ${safeUser?.firstName} ${safeUser?.lastName}!`,
    user,
    accessToken: tokens.access,
  });
});

export const logout = asyncWrapper(async (req: Request, res: Response) => {
  // Clear the refresh token cookie and delete the token record from the DB
  const { jwt: refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(204).json({ success: "Refresh token not found in cookies, logout success" });
  }

  const refreshTokenDoc = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: TokenType.REFRESH,
      blacklisted: false,
    },
  });

  if (!refreshTokenDoc) {
    res.status(404).json({ error: "Refresh Token not found" });
    return;
  }

  await prisma.token.delete({
    where: { id: refreshTokenDoc.id },
  });

  // Clear refresh token from cookies
  res.clearCookie("jwt", getCookieOptions(refreshTokenDoc.expires));
  res.status(204).send();
});

export const refreshTokens = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  log.info("Refreshing token: creating new access token if expired...");
  const { jwt: refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh Token not found" });
    return;
  }
  let refreshTokenDoc;

  try {
    // Verify the refresh token
    refreshTokenDoc = await verifyToken(refreshToken, TokenType.REFRESH);

    const user = await prisma.user.findUnique({ where: { id: refreshTokenDoc.userId } });
    if (!user) {
      res.status(404).json({ error: "User not found with that token" });
      return;
    }

    const accessToken = await generateAccessToken(user);
    res.status(200).json({ success: "Access token regenerated", accessToken });
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      // Clear refresh token from cookies and DB if expired
      res.clearCookie("jwt");
      if (refreshTokenDoc) {
        await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
      }
      return res.status(401).json({ error: "Refresh token expired. Please log in again." });
    }
  }
});

export const forgotPassword = asyncWrapper(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordBody;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: "User with that email not found" });
    return;
  }

  // Generate reset password token and send reset password email
  const resetPasswordToken = await generateResetPasswordToken(user);
  await sendResetPasswordEmail(user, resetPasswordToken);
  res.status(200).json({ message: "Check your email for further instructions" });
});

export const resetPassword = asyncWrapper(async (req: Request, res: Response) => {
  const { password: newPassword } = req.body as ResetPasswordBody;
  const { token: resetToken } = req.query as ResetPasswordQuery;

  const resetPasswordTokenDoc = await verifyToken(resetToken, TokenType.RESET_PASSWORD);
  if (!resetPasswordTokenDoc) {
    res.status(404).json({
      error: "The password reset token you provided is either invalid or has expired. Please request a new one.",
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: resetPasswordTokenDoc.userId } });
  if (!user) {
    res.status(404).json({ error: "No user found with that token" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 8);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  await prisma.token.deleteMany({
    where: { userId: user.id, type: TokenType.RESET_PASSWORD },
  });

  // Send email confirming successful password reset
  await sendSuccessResetPasswordEmail(user);
  res.status(200).json({ message: "Your password has been changed successfully" });
});

export const sendVerificationEmail = asyncWrapper(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { email: req?.user?.email } });
  if (!user) {
    res.status(404).json({ error: "User with that email not found" });
    return;
  }

  const verifyEmailToken = await generateVerifyEmailToken(req.user as User);
  await sendVerificationEmailUtil(req.user as User, verifyEmailToken);
  res.status(200).json({ message: "Check your email for further instructions" });
});

export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { token } = req.query as verifyEmailQuery;
  await verifyEmailUtil(token);
  res.status(204).send();
});