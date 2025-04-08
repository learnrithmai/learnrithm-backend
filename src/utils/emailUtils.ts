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

// Common email template styles
const emailStyles = `
  <style>
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        padding: 0 !important;
      }
      .content {
        padding: 0 !important;
      }
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #374151;
      line-height: 1.5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 4px;
    }
    .title {
      color: #111827;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .text {
      color: #374151;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      margin-top: 20px;
    }
    .details {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .details p {
      margin: 8px 0;
    }
    /* Minimalistic styles */
    .minimalistic {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #374151;
      line-height: 1.6;
    }
    .minimalistic h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #111827;
    }
    .minimalistic p {
      margin-bottom: 16px;
    }
    .minimalistic ul {
      margin-bottom: 16px;
      padding-left: 20px;
    }
    .minimalistic li {
      margin-bottom: 8px;
    }
    .minimalistic .signature {
      margin-top: 24px;
    }
    .minimalistic .signature p {
      margin-bottom: 4px;
    }
  </style>
`;

// Helper function to create email template
const createEmailTemplate = (content: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Learnrithm AI</title>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logo.png" alt="Learnrithm AI Logo" class="logo">
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Learnrithm AI. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;

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
  const subject = "Reset Your Learnrithm AI Password";
  const resetPasswordUrl = `${ENV.CLIENT_URL}/reset-password?token=${token}`;
  const content = `
    <div class="minimalistic">
      <h1>Reset Your Password</h1>
      
      <p>Hey there,</p>
      
      <p>It's Peter here, the Founder and CEO of Learnrithm AI. I noticed you requested to reset your password for your Learnrithm account.</p>
      
      <p>No worries! These things happen to all of us. To reset your password, simply click the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetPasswordUrl}" class="button">Reset Password</a>
      </div>
      
      <p>This link will expire in 60 minutes for security reasons. If you didn't request this password reset, you can safely ignore this email and your password will remain unchanged.</p>
      
      <p>If you're having trouble with the button above, you can also copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #6b7280;">${resetPasswordUrl}</p>
      
      <div class="signature">
        <p>Best regards,</p>
        <p>Peter</p>
        <p>Founder & CEO, Learnrithm AI</p>
      </div>
    </div>
  `;

  const attachments: Attachment[] = [
    {
      filename: "Full logo.png",
      path: "public/images/Full logo.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: createEmailTemplate(content),
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
  const content = `
    <h1 class="title">Password Reset Successful</h1>
    <p class="text">Hey ${user.name}!</p>
    <p class="text">This is a confirmation that the password for your account ${user.email} has been successfully reset.</p>
    <p class="text">If you did not request this, please contact us immediately.</p>
  `;

  const attachments: Attachment[] = [
    {
      filename: "Full logo.png",
      path: "public/images/Full logo.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: createEmailTemplate(content),
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
  const subject = "Verify Your Learnrithm AI Account";
  const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${token}`;
  const content = `
    <div class="minimalistic">
      <h1>Verify Your Email Address</h1>
      
      <p>Hey there,</p>
      
      <p>Its Peter here, the Founder and CEO of Learnrithm AI. Thanks for signing up for Learnrithm AI! To get started with your learning journey, we need to verify your email address.</p>
      
      <p>Please click the button below to verify your account:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <p>If you didn't create an account with Learnrithm AI, you can safely ignore this email.</p>
      
      <div class="signature">
        <p>Best regards,</p>
        <p>Peter</p>
        <p>Founder & CEO, Learnrithm AI</p>
      </div>
    </div>
  `;

  const attachments: Attachment[] = [
    {
      filename: "Full logo.png",
      path: "public/images/Full logo.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: createEmailTemplate(content),
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
  const content = `
    <div class="minimalistic">
      <h1>Welcome to Learnrithm AI!</h1>
      
      <p>Hey there,</p>
      
      <p>I'm Peter, the founder of Learnrithm AI, and I just wanted to say a big welcome!</p>
      
      <p>We built Learnrithm to make learning easier, faster, and more enjoyable. Whether you're struggling with a subject or just looking to pick up something new, our AI Teacher and Quiz tools are here to support you every step of the way.</p>
      
      <p>You're now part of a growing community of learners who are using AI to study smarter. We're constantly improving the platform based on your feedback, so feel free to reply to this email and let me know:</p>
      <ul>
        <li>What subject are you currently focused on?</li>
        <li>What would make Learnrithm even better for you?</li>
      </ul>
      
      <p>I'm really excited to have you with us—and I can't wait to see what you'll learn!</p>
      
      <div class="signature">
        <p>Talk soon,</p>
        <p>Peter</p>
        <p>Founder & CEO, Learnrithm AI</p>
      </div>
    </div>
  `;

  const attachments: Attachment[] = [
    {
      filename: "Full logo.png",
      path: "public/images/Full logo.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: createEmailTemplate(content),
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
  const formatDate = (date?: string | Date) =>
    date ? format(new Date(date), "yyyy-MM-dd") : "N/A";

  switch (event) {
    case "subscription_created":
      return {
        subject: `Thank You For Your Payment!!!!`,
        body: `
          <div class="minimalistic">
            <h1>Its Time To Learn</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>I'm Peter, the Founder and CEO of Learnrithm AI, and I'm so excited to welcome you to our application! Your decision to join ${details.product} means a lot to us, and I wanted to personally reach out to say thank you.</p>
            
            <p>I started Learnrithm AI with a simple mission: to make learning easier, more fun, and more effective for everyone. Your subscription helps us continue this mission and improve our platform every day.</p>
            
            <p>Here's what you can expect from your subscription:</p>
            <ul>
              <li>Ability To Learn Any Subject You Want</li>
              <li>Access to all our Study Modes</li>
              <li>Direct Support from our team</li>
              <li>New features and updates</li>
            </ul>
            
            <p>Your subscription details:</p>
            <div class="details">
              <p><strong>Order ID:</strong> ${details.id}</p>
              <p><strong>Order Date:</strong> ${formatDate(details.orderDate)}</p>
              <p><strong>Order Amount:</strong> ${details.orderAmount || "N/A"}</p>
              <p><strong>Card Brand:</strong> ${details.cardBrand || "N/A"}</p>
              <p><strong>Card Last Four:</strong> ${details.cardLastFour || "N/A"}</p>
              <p><strong>Trial Ends:</strong> ${formatDate(details.trialEndsAt)}</p>
              <p><strong>Renewal Date:</strong> ${formatDate(details.subscriptionRenewsAt)}</p>
              <p><strong>Order Status:</strong> ${details.status || "N/A"}</p>
            </div>
            
            <p>I'd love to hear about your learning goals! What are you most excited to learn? Feel free to reach out to me directly on X (Twitter) - I read and respond to every message personally. I'm always here to help and would love to connect with you!</p>
            
            <p>Welcome aboard!</p>
            
            <div class="signature">
              <p>Warmly,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    case "subscription_updated":
      return {
        subject: `Your ${details.product} Journey Continues!`,
        body: `
          <div class="minimalistic">
            <h1>Your Learning Journey Continues!</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here! I wanted to personally let you know that we've updated your ${details.product} subscription. Your continued trust in Learnrithm AI means the world to us!</p>
            
            <p>Here are the details of your updated subscription:</p>
            <div class="details">
              <p><strong>Order ID:</strong> ${details.id}</p>
              <p><strong>Status:</strong> ${details.status || "N/A"}</p>
              <p><strong>New Renewal Date:</strong> ${formatDate(details.subscriptionRenewsAt)}</p>
            </div>
            
            <p>How's your learning journey going? I'd love to hear about your progress and any feedback you might have. Your success is our success! Feel free to reach out to me directly on X (Twitter) - I read and respond to every message personally.</p>
            
            <div class="signature">
              <p>Warmly,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    case "subscription_cancelled":
      return {
        subject: `We'll Miss You at Learnrithm AI`,
        body: `
          <div class="minimalistic">
            <h1>We'll Miss You!</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here, and I wanted to personally reach out regarding your ${details.product} subscription cancellation. While I'm sad to see you go, I completely understand that everyone's journey is different.</p>
            
            <p>Before you leave, I'd love to hear your thoughts. I personally read and respond to every message on X (Twitter), so please reach out to me directly there. Your feedback is incredibly valuable to us and helps us become better.</p>
            
            <p>I'd love to know:</p>
            <ul>
              <li>Was there something specific that didn't meet your expectations?</li>
              <li>How can we improve our platform for future learners?</li>
              <li>Would you consider returning if we made certain changes?</li>
            </ul>
            
            <p>Remember, you can reactivate your subscription anytime by logging into your account. We'll be here if you decide to continue your learning journey with us!</p>
            
            <p>Thank you for being part of our community, even if just for a while.</p>
            
            <div class="signature">
              <p>With gratitude,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    case "subscription_expired":
      return {
        subject: `We Are Too Sad to See You Go!`,
        body: `
          <div class="minimalistic">
            <h1>Let's Continue Your Learning Journey!</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here! I noticed your ${details.product} subscription has expired, and I wanted to personally reach out. I hope you've been enjoying your learning experience with us so far!</p>
            
            <p>We miss having you as an active learner in our App. Your journey with Learnrithm AI doesn't have to end here! By renewing your subscription, you'll continue to have access to:</p>
            <ul>
              <li>All your favorite courses and materials</li>
              <li>New features and improvements we're constantly adding</li>
              <li>Our supportive learning community</li>
              <li>Personalized learning recommendations</li>
            </ul>
            
            <p>Ready to continue your learning journey? Simply log into your account to renew your subscription and use discount code <strong>RENEWAL</strong> and you'll get 20% off your subscription. If you need any help or have questions, just reach out to me directly on X (Twitter) - I'm here to help!</p>
            
            <p>Remember, every day is a new opportunity to learn and grow. Let's continue this journey together!</p>
            
            <div class="signature">
              <p>Warmly,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    case "subscription_payment_success":
      return {
        subject: `Thank You for Your Support!`,
        body: `
          <div class="minimalistic">
            <h1>Thank You for Your Support!</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here! I wanted to personally thank you for your payment for ${details.product}. Your continued support means the world to us and helps us keep improving our platform for learners like you.</p>
            
            <p>Your payment details:</p>
            <div class="details">
              <p><strong>Order ID:</strong> ${details.id}</p>
              <p><strong>Order Date:</strong> ${formatDate(details.orderDate)}</p>
              <p><strong>Amount:</strong> ${details.orderAmount || "N/A"}</p>
            </div>
            
            <p>Your support helps us:</p>
            <ul>
              <li>Develop new features and improvements</li>
              <li>Create more engaging learning content</li>
              <li>Support our growing community of learners</li>
              <li>Make learning more accessible to everyone</li>
            </ul>
            
            <p>How's your learning journey going? I'd love to hear about your progress and any feedback you might have! Feel free to reach out to me directly on X (Twitter) - I read and respond to every message personally.</p>
            
            <div class="signature">
              <p>With gratitude,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    case "subscription_payment_failed":
      return {
        subject: `Let's Get Your Learning Journey Back on Track!`,
        body: `
          <div class="minimalistic">
            <h1>Let's Get Your Learning Journey Back on Track!</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here! I noticed there was an issue with your payment for ${details.product}. Don't worry - these things happen to all of us! Let's get this sorted out so you can continue your learning journey without interruption.</p>
            
            <p>To ensure uninterrupted access to your subscription, please update your payment details in your account settings. This could be due to:</p>
            <ul>
              <li>An expired card</li>
              <li>Insufficient funds</li>
              <li>Outdated billing information</li>
            </ul>
            
            <p>Need help updating your payment information? Just reach out to me directly on X (Twitter), and I'll make sure our team assists you right away. I read and respond to every message personally, and we're here to help you succeed!</p>
            
            <p>Remember, your learning journey is important to us, and we want to make sure nothing stands in your way!</p>
            
            <div class="signature">
              <p>Warmly,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    case "subscription_payment_refunded":
      return {
        subject: `Your Refund Has Been Processed`,
        body: `
          <div class="minimalistic">
            <h1>Your Refund Has Been Processed</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here! I wanted to personally confirm that your refund for ${details.product} has been processed. We understand that circumstances change, and we want to make sure you're taken care of.</p>
            
            <p>While we're processing your refund, I wanted to take a moment to thank you for being part of our community. Your experience with Learnrithm AI matters to us, and if you'd be willing to share your feedback, it would help us improve our platform for future learners.</p>
            
            <p>If there's anything else we can help you with, or if you'd like to discuss your experience, please don't hesitate to reach out to me directly on X (Twitter). I read and respond to every message personally and would love to hear from you.</p>
            
            <p>Wishing you all the best in your learning journey, wherever it may take you!</p>
            
            <div class="signature">
              <p>With gratitude,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `A Quick Note from Learnrithm AI`,
        body: `
          <div class="minimalistic">
            <h1>A Quick Note</h1>
            
            <p>Hey ${user.name},</p>
            
            <p>It's Peter here! I wanted to reach out regarding your subscription with Learnrithm AI. Your journey with us is important, and I want to make sure you're getting the most out of your learning experience.</p>
            
            <p>How's everything going? I'd love to hear about your progress and any feedback you might have. Your success is our success! Feel free to reach out to me directly on X (Twitter) - I read and respond to every message personally.</p>
            
            <div class="signature">
              <p>Warmly,</p>
              <p>Peter</p>
              <p>Founder & CEO, Learnrithm AI</p>
            </div>
            
            <div class="social-links">
              <p>Connect with me personally:</p>
              <p>X (Twitter): <a href="https://x.com/peterlovescode">@peterlovescode</a> - I respond to every message!</p>
              <p>LinkedIn: <a href="https://www.linkedin.com/in/peterokafor">Peter Okafor</a></p>
              <p>Follow Learnrithm AI:</p>
              <p>Instagram: <a href="https://instagram.com/learnrithm">@learnrithm</a></p>
              <p>Twitter: <a href="https://twitter.com/learnrithmai">@learnrithmai</a></p>
            </div>
          </div>
        `,
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
      filename: "Full logo.png",
      path: "public/images/Full logo.png",
      cid: "logo.png",
    },
  ];

  const mailOptions: SendMailOptions = {
    from: ENV.ZOHO_SMTP_USERNAME
      ? `Learnrithm AI <${ENV.ZOHO_SMTP_USERNAME}>`
      : "support@learnrithm.com",
    to: user.email,
    subject,
    html: createEmailTemplate(body),
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
