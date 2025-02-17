import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import User from "../models/User";
import Streaker from "../models/Streaker";

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: "smtppro.zoho.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

interface EmailVerificationOptions {
  mName: string;
  app: string;
  token: string;
  email: string;
}

// Helper function to send an email verification message
async function sendEmailVerification({
  mName,
  app,
  token,
  email,
}: EmailVerificationOptions): Promise<void> {
  const verificationLink = `${process.env.WEBSITE_URL}/verify-email?token=${token}&app=${app}&email=${email}`;
  const htmlContent = `
    <html>
      <body>
        <p>Hi ${mName},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
      </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification",
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

// Signup controller
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { email, mName, password, type, plan, refCode, app, refMail, country } = req.body;
  if (!email || !password || !plan || !country) {
    return res.status(400).json({
      success: false,
      message: "Email, password, plan, and country are required.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      mName,
      password,
      type,
      plan,
      signUpApp: app,
      refUserMail: refMail,
      emailToken: token,
      emailTokenExpires: Date.now() + 3600000, // 1 hour
      country,
    });
    await newUser.save();

    // Create new streak document
    const newStreak = new Streaker({
      userId: newUser._id,
      email: email.toLowerCase(),
      signQuiz: app === "AIQuiz",
      signTeacher: app === "AITeacher",
      dateStrekingCourse: app === "AITeacher" ? new Date() : null,
      dateStrekingQuiz: app === "AIQuiz" ? new Date() : null,
    });
    await newStreak.save();

    // Link streak to the user
    newUser.streakId = newStreak._id;
    await newUser.save();

    // Send verification email
    await sendEmailVerification({ mName, app, token, email: newUser.email });

    // Optionally handle referral code
    let referralMessage = "";
    if (refCode) {
      try {
        const response = await axios.post(
          `${process.env.PARTNER_SERVER}/api/RefUser`,
          {
            data: { refCode, refMail, app, email },
          }
        );
        referralMessage = response.data.mss;
      } catch (error) {
        console.error("Error with referral system:", error);
      }
    }

    return res.json({
      success: true,
      message: `Account created successfully. ${referralMessage}`,
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Email verification controller
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { token } = req.body;
  try {
    const user = await User.findOne({
      emailToken: token,
      emailTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token.", status: 500 });
    }
    user.isVerified = true;
    user.emailToken = undefined;
    user.emailTokenExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully!", status: 200 });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Resend email verification controller
export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const newToken = crypto.randomBytes(32).toString("hex");
    user.emailToken = newToken;
    user.emailTokenExpires = Date.now() + 3600000;
    await user.save();

    await sendEmailVerification({
      mName: user.mName,
      app: user.signUpApp,
      token: newToken,
      email: user.email,
    });

    return res.status(200).json({ success: true, message: "Verification email resent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ success: false, message: "Error sending email" });
  }
};

// Signin controller
export const signin = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { email, signInApp } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // NOTE: Password validation logic should be added here

    // (Optionally update streak info; for brevity, streak logic is omitted.)

    return res.json({
      success: true,
      message: "SignIn successful",
      userData: {
        _id: user._id,
        email: user.email,
        mName: user.mName,
        type: user.type,
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Profile update controller
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { email, mName, password, uid } = req.body;
  try {
    const updateData: { [key: string]: any } = { email, mName };
    if (password && password.trim() !== "") {
      updateData.password = password;
    }
    await User.findOneAndUpdate({ _id: uid }, { $set: updateData });
    return res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update user plan controller
export const updateUserPlan = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { email, plan } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { type: plan } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User plan updated successfully", user });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Forgot password controller
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { email, name, company, logo } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: `${name} Password Reset`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    };
    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Reset password controller
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  const { password, token } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.json({
      success: true,
      message: "Password updated successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
