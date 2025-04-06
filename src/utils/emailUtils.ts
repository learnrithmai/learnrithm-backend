import { transporter } from "@/config/email/nodemailConfig";
import logger from "@/utils/chalkLogger";
import { ENV } from "@/validations/envSchema";
import { format } from "date-fns";
import { SendMailOptions } from "nodemailer";
import { Attachment } from "nodemailer/lib/mailer";

type User = {
  name: string;
  email: string;
};


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
    <h1>Hey ${user.name}!</h1>
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
      <h1>Hey ${user.name}!</h1>
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
    <h1>Hello ${user.name}!</h1>
    <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify Email</a></p>
    <p>If you did not create an account, please ignore this email or contact support.</p>
    <p>Best regards,<br/>Learnrithm AI Team</p>`;

  const attachments: Attachment[] = [
    {
      filename: "Learnrithm.png",
      path: "public/images/Learnrithm.png",
      cid: "Learnrithm.png",
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
 * Send welcome email upon user registration
 * @param {User} user
 * @returns {Promise<void>}
 */
export const sendRegisterEmail = async (user: User): Promise<void> => {
  const subject = "Welcome to Learnrithm AI";
  const body = `<img src="cid:logo.png" alt="logo"/>
    <h1>Welcome ${user.name}!</h1>
    <p>Thank you for registering with Learnrithm AI. We're excited to have you on board!</p>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br/>The Learnrithm AI Team</p>`;

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
  logger.info(`A welcome email has been sent to ${user.email}`);
};

// Define a union type for subscription events
export type SubscriptionEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_refunded";

export interface PaymentDetails {
  product: string;
  id: string;
  orderAmount?: number;
  orderDate?: string | Date;
  cardBrand?: string;
  cardLastFour?: string;
  country?: string;
  trialEndsAt?: string | Date;
  subscriptionRenewsAt?: string | Date;
  status?: string;
}

// This interface holds the email content
export interface EmailContent {
  subject: string;
  body: string;
}

// Helper to dynamically generate email content based on the event
const getEmailContent = (
  event: SubscriptionEvent,
  user: User,
  details: PaymentDetails
): EmailContent => {
  // Default date formatting helper
  const formatDate = (date?: string | Date) =>
    date ? format(new Date(date), "yyyy-MM-dd") : "N/A";

  switch (event) {
    case "subscription_created":
      return {
        subject: `${details.product} Recipe from Learnrithm AI`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>Thank you for subscribing to ${details.product} with Learnrithm AI. We're excited to have you onboard!</p>
          <p>Order ID: ${details.id}</p>
          <p>Order Date: ${formatDate(details.orderDate)}</p>
          <p>Order Amount: ${details.orderAmount || "N/A"}</p>
          <p>Card Brand: ${details.cardBrand || "N/A"}</p>
          <p>Card Last Four: ${details.cardLastFour || "N/A"}</p>
          <p>Trial Ends: ${formatDate(details.trialEndsAt)}</p>
          <p>Renewal Date: ${formatDate(details.subscriptionRenewsAt)}</p>
          <p>Order Status: ${details.status || "N/A"}</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    case "subscription_updated":
      return {
        subject: `Your ${details.product} Subscription has been updated`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>Your subscription for ${details.product} has been updated successfully.</p>
          <p>Order ID: ${details.id}</p>
          <p>Status: ${details.status || "N/A"}</p>
          <p>New Renewal Date: ${formatDate(details.subscriptionRenewsAt)}</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    case "subscription_cancelled":
      return {
        subject: `Your ${details.product} Subscription has been cancelled`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>Your subscription for ${details.product} has been cancelled. We're sorry to see you go.</p>
          <p>If you have any feedback or questions, please contact our support team.</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    case "subscription_expired":
      return {
        subject: `Your ${details.product} Subscription has expired`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>Your subscription for ${details.product} has expired.</p>
          <p>To continue enjoying our services, please consider renewing your subscription.</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    case "subscription_payment_success":
      return {
        subject: `Payment Successful for ${details.product}`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>We have received your payment for ${details.product} successfully.</p>
          <p>Order ID: ${details.id}</p>
          <p>Order Date: ${formatDate(details.orderDate)}</p>
          <p>Amount: ${details.orderAmount || "N/A"}</p>
          <p>Thank you for your payment!</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    case "subscription_payment_failed":
      return {
        subject: `Payment Failed for ${details.product}`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>Unfortunately, your payment for ${details.product} has failed.</p>
          <p>Please update your payment details and try again.</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    case "subscription_payment_refunded":
      return {
        subject: `Payment Refunded for ${details.product}`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>Your payment for ${details.product} has been refunded.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };

    default:
      return {
        subject: `Notification from Learnrithm AI`,
        body: `<img src="cid:logo.png" alt="logo"/>
          <h1>Hello ${user.name}!</h1>
          <p>This is a notification regarding your subscription.</p>
          <p>Best regards,<br/>The Learnrithm AI Team</p>`,
      };
  }
};

// The refactored, dynamic email sending function
export const sendDynamicEmail = async (
  user: User,
  paymentDetails: PaymentDetails,
  event: SubscriptionEvent
): Promise<void> => {
  const { subject, body } = getEmailContent(event, user, paymentDetails);

  const attachments = [
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

  try {
    const mailInfo = await sendEmail(mailOptions);
    logger.info(
      `Email sent to ${user.email} for event ${event} with info: ${JSON.stringify(
        mailInfo
      )}`
    );
  } catch (error) {
    logger.error(`Failed to send email to ${user.email}: ${error}`);
    throw error;
  }
};
