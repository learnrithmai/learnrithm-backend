import { tokenTypes } from "@/config/const";
import prisma from "@/config/db/prisma";
import { getCookieOptions } from "@/config/security/cookieOptions";
import { asyncWrapper } from "@/middleware/asyncWrapper";
import {
  isPasswordMatch,
  verifyEmail as verifyEmailUtil,
} from "@/utils/authUtils";
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
  VerifyEmailQuery,
} from "@/validations/authSchema";
import { TokenType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

// ────────────────────────────────────────────────────────────────
// REGISTER USER
// ────────────────────────────────────────────────────────────────

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, Name, password, country, referralCode } =
    req.body as RegisterUserBody;

  if (!email || !password || !Name || !country) {
    res
      .status(400)
      .json({ errorMsg: "Email, name, password, and country are required" });
    return;
  }

  const normalizedEmail = typeof email === "string" ? email.toLowerCase() : "";

  // Check if a user with the same email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    res.status(409).json({ errorMsg: "User already exists" });
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password as string, 10);

  // Create new user in the merged User model
  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      Name,
      country: country as string,
      lastLogin: new Date(),
    },
  });

  if (!newUser) {
    res.status(500).json({ errorMsg: "User creation failed" });
    return;
  }

  // Process referral if provided (assuming referral models remain unchanged)
  if (referralCode) {
    const referrer = await prisma.referralCode.findUnique({
      where: { code: referralCode as string },
    });
    if (referrer) {
      await prisma.userReferredBy.create({
        data: {
          userId: newUser.id,
          referredUserId: referrer.userId,
          email: normalizedEmail,
          referredUserEmail: referrer.email,
          date: new Date(),
          refCodeUsed: referralCode as string,
          referringType: "sign",
          referringSource: "signup",
        },
      });
    }
  }

  res.status(201).json({
    success: `User ${newUser.email} created successfully!`,
    user: newUser,
  });
};

// ────────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginBody;
  const normalizedIdentifier = email.toLowerCase();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedIdentifier },
  });

  if (!user) {
    res.status(404).json({ error: "User with that email not found" });
    return;
  }

  // Verify password match
  if (!(await isPasswordMatch(password, user.password))) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  // Generate authentication tokens
  const tokens = await generateAuthTokens(user);

  // Set secure refresh token cookie
  res.cookie(
    "jwt",
    tokens.refresh.token,
    getCookieOptions(tokens.refresh.expires),
  );

  res.send({
    success: `Login successful: ${user.Name}!`,
    user,
    accessToken: tokens.access,
  });
};

// ────────────────────────────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { jwt: refreshToken } = req.cookies;

  if (!refreshToken) {
    res
      .status(204)
      .json({ success: "Refresh token not found in cookies, logout success" });
    return;
  }

  const refreshTokenDoc = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      tokenType: tokenTypes.REFRESH as TokenType,
    },
  });

  if (!refreshTokenDoc) {
    res.status(404).json({ error: "Refresh token not found" });
    return;
  }

  await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
  res.clearCookie("jwt", getCookieOptions(refreshTokenDoc.tokenExpires));
  res.status(204).send();
};

// ────────────────────────────────────────────────────────────────
// REFRESH TOKENS
// ────────────────────────────────────────────────────────────────

export const refreshTokens = async (
  req: Request,
  res: Response,
): Promise<void> => {
  log.info("Refreshing token: creating new access token if expired...");
  const { jwt: refreshToken } = req.cookies;
  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token not found" });
    return;
  }
  let refreshTokenDoc;
  try {
    refreshTokenDoc = await verifyToken(
      refreshToken,
      tokenTypes.REFRESH as TokenType,
    );
    const user = await prisma.user.findUnique({
      where: { id: refreshTokenDoc.userId },
    });
    if (!user) {
      res.status(404).json({ error: "User not found with that token" });
      return;
    }
    const accessToken = await generateAccessToken(user);
    res.status(200).json({ success: "Access token regenerated", accessToken });
  } catch (error) {
    if ((error as Error)?.name === "TokenExpiredError") {
      res.clearCookie("jwt");
      if (refreshTokenDoc) {
        await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
      }
      res
        .status(401)
        .json({ error: "Refresh token expired. Please log in again." });
      return;
    }
    res
      .status(500)
      .json({ error: "An error occurred while refreshing tokens." });
  }
};

// ────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ────────────────────────────────────────────────────────────────

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body as ForgotPasswordBody;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    res.status(404).json({ error: "User with that email not found" });
    return;
  }

  // Generate reset token and send email using the merged user model
  const resetPasswordToken = await generateResetPasswordToken(user);

  await sendResetPasswordEmail(user, resetPasswordToken);
  res
    .status(200)
    .json({ message: "Check your email for further instructions" });
};

// ────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ────────────────────────────────────────────────────────────────

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { password: newPassword } = req.body as ResetPasswordBody;
  const { token: resetToken } = req.query as ResetPasswordQuery;

  const resetTokenDoc = await verifyToken(
    resetToken,
    tokenTypes.RESET_PASSWORD as TokenType,
  );
  if (!resetTokenDoc) {
    res.status(404).json({
      error:
        "The password reset token you provided is either invalid or has expired. Please request a new one.",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: resetTokenDoc.userId },
  });
  if (!user) {
    res.status(404).json({ error: "No user found with that token" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 8);

  // Update password in the merged User model
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  await prisma.token.deleteMany({
    where: {
      userId: user.id,
      tokenType: tokenTypes.RESET_PASSWORD as TokenType,
    },
  });

  await sendSuccessResetPasswordEmail(user);
  res
    .status(200)
    .json({ message: "Your password has been changed successfully" });
};

// ────────────────────────────────────────────────────────────────
// SEND VERIFICATION EMAIL
// ────────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email: req.user?.email },
  });
  if (!user) {
    res.status(404).json({ error: "User with that email not found" });
    return;
  }

  const verifyEmailToken = await generateVerifyEmailToken(
    req.user as {
      id: string;
      email: string;
      password: string;
      createdAt: Date | null;
    },
  );

  await sendVerificationEmailUtil(user, verifyEmailToken);
  res
    .status(200)
    .json({ message: "Check your email for further instructions" });
};

// ────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ────────────────────────────────────────────────────────────────

export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { token } = req.query as VerifyEmailQuery;
  await verifyEmailUtil(token);
  res.status(204).send();
});
