import axios from "axios";
import bcrypt from "bcryptjs";
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
  const hashValue = sha1(password).toUpperCase();
  const prefix = hashValue.slice(0, 5);
  const suffix = hashValue.slice(5);

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
export const generateUsername = (firstName: string, lastName: string) => {
  const hash = createHash("md5")
    .update(`${firstName}${lastName}${Date.now()}`)
    .digest("hex")
    .slice(0, 6);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${hash}`;
};
