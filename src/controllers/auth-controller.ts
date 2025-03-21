import { tokenTypes } from "@/config/const";
import prisma from "@/config/db/prisma";
import { getCookieOptions } from "@/config/security/cookieOptions";
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
import geoip from "geoip-lite";

// ────────────────────────────────────────────────────────────────
// REGISTER USER
// ────────────────────────────────────────────────────────────────

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, Name, image, password, country, referralCode, method } =
      req.body as RegisterUserBody;

    console.table({
      email,
      Name,
      image,
      password,
      country,
      referralCode,
      method,
    });

    // Validate required fields
    if (!email || !Name || !method) {
      res
        .status(400)
        .json({ errorMsg: "Email, Name, and method are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Check if a user with the same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      res.status(409).json({ errorMsg: "User already exists" });
      return;
    }

    // Get country from IP if not provided
    let userCountry = country;
    if (!userCountry) {
      const userIp =
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress;
      if (userIp) {
        const geo = geoip.lookup(userIp);
        userCountry = geo?.country || "Unknown";
      }
    }

    // For normal sign-ups, ensure a password is provided and hash it
    let hashedPassword = null;
    if (method === "normal") {
      if (!password) {
        res
          .status(401)
          .json({ errorMsg: "Password is required for normal registration" });
        return;
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Use a transaction to ensure that user creation, token creation, and referral processing happen atomically
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the new user record
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          imgThumbnail: image,
          method,
          password: method === "normal" ? hashedPassword : null,
          Name,
          country: userCountry as string,
          lastLogin: new Date(),
        },
      });

      // Process referral if a referral code is provided
      if (referralCode) {
        const referrer = await tx.referralCode.findUnique({
          where: { code: referralCode },
        });
        if (referrer) {
          await tx.userReferredBy.create({
            data: {
              userId: createdUser.id,
              referredUserId: referrer.userId,
              email: normalizedEmail,
              referredUserEmail: referrer.email,
              date: new Date(),
              refCodeUsed: referralCode,
              referringType: "sign",
              referringSource: "signup",
            },
          });
        }
      }

      return createdUser;
    });

    res.status(201).json({
      success: `User ${newUser.email} created successfully!`,
      user: newUser,
    });
    return;
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      errorMsg: "User creation failed",
      details: error instanceof Error ? error.message : error,
    });
    return;
  }
};

// ────────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginBody;
  const normalizedIdentifier = email.toLowerCase();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedIdentifier, method: "normal" },
    select: {
      id: true,
      method: true,
      password: true,
      Name: true,
      email: true,
      createdAt: true,
    },
  });

  if (user?.method === "google") {
    res.status(405).json({ error: "User auth used google" });
    return;
  }

  if (!user || !user.password) {
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
      where: { id: refreshTokenDoc.userId, method: "normal" },
    });
    if (!user || !user.password) {
      res.status(404).json({ error: "User with that email not found" });
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
    where: { email: normalizedEmail, method: "normal" },
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
    where: { id: resetTokenDoc.userId, method: "normal" },
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
    where: { email: req.user?.email, method: "normal" },
  });
  if (!user) {
    res.status(404).json({ error: "User with that email not found" });
    return;
  }

  const verifyEmailToken = await generateVerifyEmailToken(
    req.user as {
      id: string;
      email: string;
      Name: string;
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

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.query as VerifyEmailQuery;
  await verifyEmailUtil(token);
  res.status(204).send();
};
