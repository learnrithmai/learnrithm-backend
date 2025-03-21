import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { ENV } from "../../validations/envSchema";

//? Zoho Mail SMTP Configuration
export const smtpConfig: SMTPTransport.Options = {
  host: ENV.ZOHO_SMTP_HOST || "smtp.zoho.com",
  port: parseInt(`${ENV.ZOHO_SMTP_PORT || 465}`, 10), // Use 465 for SSL or 587 for TLS
  secure: ENV.ZOHO_SMTP_PORT === 465, // `true` for 465 (SSL), `false` for 587 (TLS)
  auth: {
    user: ENV.ZOHO_SMTP_USERNAME || "", // Zoho Mail Email Address
    pass: ENV.ZOHO_SMTP_PASSWORD || "", // Zoho Mail App Password
  },
};

export const transporter: Transporter = nodemailer.createTransport(smtpConfig);