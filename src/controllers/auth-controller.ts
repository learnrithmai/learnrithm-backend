import prisma from "@/config/db/prisma";
import { getCookieOptions } from "@/config/security/cookieOptions";
import { countryCodes } from "@/data/countries-per-abr";
import { asyncWrapper } from "@/middleware/asyncWrapper";
import { isPasswordMatch } from "@/utils/authUtils";
import log from "@/utils/chalkLogger";
import {
  sendRegisterEmail,
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
import { ENV } from "@/validations/envSchema";
import { TokenType } from "@prisma/client";
import axios from "axios";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import geoip from "geoip-lite";

// ────────────────────────────────────────────────────────────────
// REGISTER USER
// ────────────────────────────────────────────────────────────────

export const registerUser = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        name,
        image,
        password,
        country,
        referralCode,
        method,
      } = req.body as RegisterUserBody;

      // Validate required fields.
      if (!email || !name || !method) {
        res
          .status(400)
          .json({ errorMsg: "Email, Name, and method are required" });
        return;
      }

      const normalizedEmail = email.toLowerCase();

      // Check if user exists.
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        res.status(409).json({ errorMsg: "User already exists" });
        return;
      }

      // Determine country from IP if not provided.
      let userCountry = country;
      if (!userCountry) {
        const userIp =
          req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
          req.socket.remoteAddress;
        if (userIp) {
          const geo = geoip.lookup(userIp);
          const country = geo?.country || "Unknown";
          userCountry = countryCodes[country] || "United States";
        }
      }

      // For normal sign-ups, require and hash a password.
      let hashedPassword: string | null = null;
      if (method === "normal") {
        if (!password) {
          res
            .status(401)
            .json({ errorMsg: "Password is required for normal registration" });
          return;
        }
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Use a transaction for atomic operations.
      const { createdUser, tokens } = await prisma.$transaction(async (tx) => {
        // Create the new user.
        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            image,
            method,
            password: method === "normal" ? hashedPassword : null,
            name,
            country: userCountry as string,
            lastLogin: new Date(),
            plan: "free",
            language: "english",
          },
        });

        // Generate authentication tokens.
        const tokens = await generateAuthTokens(createdUser);

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

        return { createdUser, tokens };
      });
      await sendRegisterEmail({ name, email });

      if (method === "normal") {
        await axios.post(`${ENV.SERVER_API_URL}/auth/send-verification-email`, {
          email,
        });
      }

      // Build the client user object.
      const clientUser = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        method: createdUser.method,
        lastLogin: createdUser?.lastLogin
          ? new Date(createdUser.lastLogin).toISOString()
          : null,
        image: createdUser.image,
        plan: createdUser.plan,
        country: createdUser.country,
        tokens,
      };

      res.status(201).json({
        success: `User ${createdUser.email} created successfully!`,
        user: clientUser,
      });
    } catch (error) {
      console.error("Error in registerUser:", error);
      res.status(500).json({
        errorMsg: "User creation failed",
        details: error instanceof Error ? error.message : error,
      });
    }
  }
);

// ────────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────────

export const login = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, image, method } = req.body as LoginBody;
    const normalizedIdentifier = email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedIdentifier, method: method, archived: false },
      select: {
        id: true,
        method: true,
        password: true,
        name: true,
        email: true,
        lastLogin: true,
        image: true,
        createdAt: true,
        plan: true,
        country: true
      },
    });

    if (!user) {
      res.status(404).json({ error: "User with that email not found" });
      return;
    }

    if (user?.method === 'normal') {
      if (!email || !password || !user.password) {
        res.status(404).json({ error: "User with that email not found" });
        return;
      }

      // Verify password match
      if (!(await isPasswordMatch(password, user.password))) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }
    } else if (user?.method === 'google') {
      if (!email) {
        res.status(404).json({ error: "User with that email not found" });
        return;
      }
      if (image) {
        await prisma.user.update({ where: { email }, data: { image } });
      }
    }

    // Generate authentication tokens
    const tokens = await generateAuthTokens(user);

    const clientUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      method: user.method,
      lastLogin: user?.lastLogin
        ? new Date(user.lastLogin).toISOString()
        : null,
      image: user.image,
      plan: user.plan,
      country: user.country,
      tokens,
    };

    res.send({
      success: `Login successful: ${user.name}!`,
      user: clientUser,
    });
  }
);

// ────────────────────────────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────────────────────────────

export const logout = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { jwt: refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(204).json({
        success: "Refresh token not found in cookies, logout success",
      });
      return;
    }

    const refreshTokenDoc = await prisma.token.findFirst({
      where: {
        token: refreshToken,
        tokenType: TokenType.refresh,
      },
    });

    if (!refreshTokenDoc) {
      res.status(404).json({ error: "Refresh token not found" });
      return;
    }

    await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
    res.clearCookie(
      "jwt",
      getCookieOptions(false, refreshTokenDoc.tokenExpires)
    );
    res.status(204).send();
  }
);

// ────────────────────────────────────────────────────────────────
// REFRESH TOKENS
// ────────────────────────────────────────────────────────────────

export const refreshTokens = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    log.info("Refreshing token: creating new access token if expired...");
    const { jwt: refreshToken } = req.cookies;
    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token not found" });
      return;
    }
    let refreshTokenDoc;
    try {
      refreshTokenDoc = await verifyToken(refreshToken, TokenType.refresh);
      const user = await prisma.user.findUnique({
        where: { id: refreshTokenDoc.userId, method: "normal" },
      });
      if (!user) {
        res.status(404).json({ error: "User with that email not found" });
        return;
      }
      // Assume generateAccessToken returns an object with 'token' (string) and 'expiresAt' (number in seconds)
      const { token: newAccessToken, expires } =
        await generateAccessToken(user);

      res.status(200).json({
        success: "Access token regenerated",
        tokens: {
          access: {
            token: newAccessToken,
            expires: expires,
          },
          refresh: {
            token: refreshToken,
            expires: refreshTokenDoc.tokenExpires,
          },
        },
      });
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
  }
);

// ────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ────────────────────────────────────────────────────────────────

export const forgotPassword = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body as ForgotPasswordBody;

      if (!email) {
        res.status(400).json({ error: "User information is missing" });
        return;
      }

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
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ────────────────────────────────────────────────────────────────

export const resetPassword = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { password: newPassword } = req.body as ResetPasswordBody;
    const { token: resetToken } = req.query as ResetPasswordQuery;

    const resetTokenDoc = await verifyToken(
      resetToken,
      TokenType.password_reset
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
        tokenType: TokenType.password_reset,
      },
    });

    await sendSuccessResetPasswordEmail(user);
    res
      .status(200)
      .json({ message: "Your password has been changed successfully" });
  }
);

// ────────────────────────────────────────────────────────────────
// SEND VERIFICATION EMAIL
// ────────────────────────────────────────────────────────────────

export const sendVerificationEmail = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure that the request body is parsed JSON
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: "User information is missing" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email, method: "normal" },
      });

      if (!user) {
        res.status(404).json({ error: "User with that email not found" });
        return;
      }

      const verifyEmailToken = await generateVerifyEmailToken(user);

      await sendVerificationEmailUtil(user, verifyEmailToken);

      // Create/update notifier for verification email update
      await prisma.notifier.create({
        data: {
          userId: user.id,
          email: email,
          notifyType: "email_validation",
          notify: new Date(),
        },
      });
      res
        .status(200)
        .json({ message: "Check your email for further instructions" });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// ────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ────────────────────────────────────────────────────────────────

export const verifyEmail = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { token: verifyEmailToken } = req.query as VerifyEmailQuery;

    const verifyEmailTokenDoc = await verifyToken(
      verifyEmailToken,
      TokenType.email_validation
    );
    if (!verifyEmailTokenDoc) {
      res.status(404).json({
        error:
          "The verification email token you provided is either invalid or has expired. Please request a new one.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: verifyEmailTokenDoc.userId, method: "normal" },
    });
    if (!user) {
      res.status(404).json({ error: "No user found with that token" });
      return;
    }

    // Update the merged user model directly
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
    // Delete any existing email verification tokens
    await prisma.token.deleteMany({
      where: { userId: user.id, tokenType: TokenType.email_validation },
    });
    // Create/update notifier for verification email update
    await prisma.notifier.deleteMany({
      where: {
        userId: user.id,
        notifyType: "email_validation",
      },
    });
    res.status(204).send();
  }
);