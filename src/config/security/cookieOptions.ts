import { ENV } from "@/validations/envSchema";
import { isProd } from "../../config/const";
import { CookieOptions } from "express";

/**
 * Get cookie options for setting cookies in an Express application.
 *
 * @param {Date} [expires] - The expiration date of the cookie.
 * @param {boolean} [httpOnly=true] - Whether the cookie is HTTP only.
 * @param {boolean} [rememberMe=true] - Whether to use the "remember me" option for cookie max age.
 * @returns {CookieOptions} The cookie options.
 * @description
 *  * Use the httpOnly flag to prevent JavaScript from reading it.
 *  * Use the secure=true flag so it can only be sent over HTTPS.
 *  * Use the SameSite=strict flag whenever possible to prevent CSRF. This can only be used if the Authorization Server has the same site as your front-end.
 * @example
 * // Basic usage
 * const options = getCookieOptions(new Date(Date.now() + 3600000)); // Expires in 1 hour
 *
 * @example
 * // With custom httpOnly and rememberMe
 * const options = getCookieOptions(new Date(Date.now() + 3600000), false, false);
 */
export const getCookieOptions = (
  rememberMe: boolean,
  expires?: Date,
  httpOnly: boolean = true
): CookieOptions => ({
  httpOnly,
  secure: isProd,
  sameSite: isProd ? "strict" : "lax", // Corrected the casing
  expires,
  maxAge: rememberMe ? ENV.COOKIE_MAX_AGE_REMEMBER_ME : ENV.COOKIE_MAX_AGE, //* use this line if you have a remember me option
  // maxAge: 2000, //! use this line if you don't have a remember me option
});
