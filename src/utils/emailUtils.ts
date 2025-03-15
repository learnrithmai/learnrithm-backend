import { transporter } from "@/config/email/nodemailConfig";
import logger from "@/utils/chalkLogger";
import { ENV } from "@/validations/envSchema";
import { User } from "@prisma/client";
import { format } from "date-fns";
import { SendMailOptions } from "nodemailer";
import { Attachment } from "nodemailer/lib/mailer";

// @ts-expect-error : test is not defined in process.env
if (ENV.NODE_ENV !== "test") {
  try {
    // await transporter.verify();
    const formattedDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    logger.info("NODEMAILER", `Connected to email server at ${formattedDate}`);
  } catch {
    const formattedDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    logger.warning(
      "NODEMAILER",
      `Unable to connect to email server at ${formattedDate}. Make sure you have configured the SMTP options in .env`,
    );
  }
}

/**
 * Send an email using the transporter
 * @param {SendMailOptions} mailOptions
 * @returns {Promise<void>}
 */
export const sendEmail = async (
  mailOptions: SendMailOptions,
): Promise<void> => {
  return await transporter.sendMail(mailOptions);
};

/**
 * Send reset password email
 * @param {User} user
 * @param {string} token
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (
  user: User,
  token: string,
): Promise<void> => {
  const subject = "Reset password";
  const resetPasswordUrl = `${ENV.CLIENT_URL}/reset-password?token=${token}`;
  const body = `<img src="cid:logo.png" alt="logo"/>
    <h1>Hey ${user.Name}!</h1>
    <p>You are receiving this because you (or someone else) have requested the <strong>reset of the password</strong> for your account.</p>
    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
    <a href="${resetPasswordUrl}">Reset password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`;
  const attachments: Attachment[] = [
    {
      filename: "logo.svg",
      path: "public/images/Learnrithm.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: body,
    attachments,
  };
  const mailInfo = await sendEmail(mailOptions);
  console.log("Message: %s", JSON.stringify(mailInfo));
  logger.info(
    `An e-mail has been sent to ${user.email} with further instructions.`,
  );
};

/**
 * Send successful reset password email
 * @param {User} user
 * @returns {Promise<void>}
 */
export const sendSuccessResetPasswordEmail = async (
  user: User,
): Promise<void> => {
  const subject = "Password Reset Successfully";
  const body = `<img src="cid:logo.png" alt="logo"/>
      <h1>Hey ${user.Name}!</h1>
      <p>This is a confirmation that the password for your account ${user.email} has been successfully reset.</p>
      <p>If you did not request this, please contact us immediately.</p>`;

  const attachments: Attachment[] = [
    {
      filename: "logo.svg",
      path: "public/images/Learnrithm.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: body,
    attachments,
  };

  const mailInfo = await sendEmail(mailOptions);
  console.log("Message: %s", JSON.stringify(mailInfo));
  logger.info(
    `An e-mail has been sent to ${user.email} with further instructions.`,
  );
};

/**
 * Send verification email
 * @param {User} user
 * @param {string} token
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (
  user: User,
  token: string,
): Promise<void> => {
  const subject = "Email Verification";
  const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${token}`;
  const body = `<img src="cid:logo.png" alt="logo"/>
    <h1>Hello ${user.Name}!</h1>
    <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify Email</a></p>
    <p>If you did not create an account, please ignore this email or contact support.</p>
    <p>Best regards,<br/>Learnrithm AI Team</p>`;

  const attachments: Attachment[] = [
    {
      filename: "logo.svg",
      path: "public/email/logo.svg",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: body,
    attachments,
  };

  const mailInfo = await sendEmail(mailOptions);
  console.log("Message: %s", JSON.stringify(mailInfo));
  logger.info(
    `An e-mail has been sent to ${user.email} with further instructions.`,
  );
};
