import prisma from "@/config/db/prisma";
import ApiError from "@/utils/apiError";
import { verifyToken } from "@/utils/tokenUtils";
import { TokenType } from "@prisma/client";
import axios from "axios";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import sha1 from "sha1";

/**
 * Compare plain text password with hashed password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const isPasswordMatch = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
export const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenDoc = await verifyToken(
      verifyEmailToken,
      TokenType.email_validation,
    );
    const user = await prisma.user.findUnique({
      where: { id: verifyEmailTokenDoc.userId },
    });
    if (!user) {
      throw new ApiError(404, "No users found");
    }
    await prisma.userInfo.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
    await prisma.userDetails.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
    await prisma.token.deleteMany({
      where: { userId: user.id, tokenType: TokenType.email_validation },
    });
  } catch (error: unknown) {
    console.log(error);
    throw new ApiError(401, "Email verification failed");
  }
};

/*
Check if a password has been compromised:
You can use the Have I Been Pwned API to check if a password has been compromised.

* usage :
const passCompromised = await isPasswordCompromised(password);
if (passCompromised) {
	return next(createError.BadRequest("This password has been compromised."));
}
*/
export const isPasswordCompromised = async (
  password: string,
): Promise<boolean> => {
  const hash = sha1(password).toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await axios.get(
    `https://api.pwnedpasswords.com/range/${prefix}`,
  );
  const hashes = response.data.split("\r\n");

  for (const hash of hashes) {
    const [hashSuffix] = hash.split(":");
    if (hashSuffix === suffix) {
      return true;
    }
  }

  return false;
};

/*
Check if an email is a temporary email:
There are several services that provide APIs to check if an email is a temporary email,
such as Block Temp Email, Email Checker, etc.
Here's an example of how you could use the Block Temp Email API:

* usage :
const tempEmail = await isEmailTemporay(email);
if (tempEmail) {
    return next(createError.BadRequest("Temporary emails are not allowed."));
}
*/
export const isEmailTemporay = async (email: string): Promise<boolean> => {
  const domain = email.split("@")[1];
  const response = await axios.get(
    `https://disposable.debounce.io/?domain=${domain}`,
  );
  return response.data.disposable;
};

/*
Check if an email is a temporary email:
There are several services that provide APIs to check if an email is a temporary email,
such as Block Temp Email, Email Checker, etc.
Here's an example of how you could use the Block Temp Email API:

* usage :
const tempEmail = await isEmailTemporayII(email);
if (tempEmail) {
    return next(createError.BadRequest("Temporary emails are not allowed."));
}
*/
export const isEmailTemporayII = async (email: string): Promise<boolean> => {
  const response = await axios.get(
    `https://block-temp-email.vercel.app/api/${email}`,
  );
  return response.data.blocked;
};

/**
 * Generate a unique username
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 * @example
 * const username = generateUsername("John", "Doe");
 * // john.doe.a1b2c3
 */
// Function to generate a unique username
export const generateUsername = (firstName: string, lastName: string) => {
  const hash = createHash("md5")
    .update(`${firstName}${lastName}${Date.now()}`)
    .digest("hex")
    .slice(0, 6);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${hash}`;
};
