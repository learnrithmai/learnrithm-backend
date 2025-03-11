import crypto from "node:crypto";
import safeRegex from "safe-regex";

/**
 * Converts bytes to megabytes.
 * @param {number} byte - The number of bytes to convert.
 * @returns {number} The converted value in megabytes.
 * @example
 * // returns "1.00"
 * byteToMb(1048576);
 */
export function byteToMb(byte: number): number {
  return Number((byte / 1024 / 1024).toFixed(2));
}

/**
 * Converts megabytes to bytes.
 * @param {number} mb - The number of megabytes to convert.
 * @returns {number} The converted value in bytes.
 * @example
 * // returns 1048576
 * mbToByte(1);
 */
export function mbToByte(mb: number): number {
  return mb * 1024 * 1024;
}

/**
 * Converts a time string to milliseconds.
 * @param {string} timeString - The time string to convert.
 * @returns {number} The converted time in milliseconds.
 * @example
 * // returns 60000
 * convertToMilliseconds("1m");
 * @example
 * // returns 3600000
 * convertToMilliseconds("1h");
 * @example
 * // returns 86400000
 * convertToMilliseconds("1d");
 * @example
 * // returns 604800000
 */
export function convertToMilliseconds(timeString: string): number {
  const units = timeString.slice(-1);
  const value = Number.parseInt(timeString.slice(0, -1));

  switch (units) {
    case "s": {
      return value * 1000;
    }
    case "m": {
      return value * 60 * 1000;
    }
    case "h": {
      return value * 60 * 60 * 1000;
    }
    case "d": {
      return value * 24 * 60 * 60 * 1000;
    }
    default: {
      throw new Error(`Unknown time unit: ${units}`);
    }
  }
}

/**
 * Generates a UUID.
 * @returns {crypto.UUID} The generated UUID.
 * @example
 * // returns a UUID string
 * uuid();
 */
export function uuid(): crypto.UUID {
  return crypto.randomUUID();
}

/**
 * Generates a hashed token.
 * @returns {string} The generated reset token.
 */
export function generateHashedToken(size: number): string {
  return crypto.randomBytes(size).toString("hex");
}

/**
 * Checks if a percentage is positive.
 * @param {string} percent - The percentage to check.
 * @returns {boolean} True if the percentage is positive, false otherwise.
 * @example
 * // returns true
 * signChecker("10%");
 */
export function signChecker(percent: string): boolean {
  const numericPercent = Number.parseFloat(percent); // Convert string percentage to a number
  return numericPercent > 0;
}

/**
 * Checks if multiple regular expressions are safe.
 *
 * @param {...RegExp} regexes - The regular expressions to check.
 * @returns {{allSafe: boolean, unsafeRegexes: RegExp[]}} - Returns an object with a boolean property 'allSafe' indicating if all regular expressions are safe, and an 'unsafeRegexes' property containing an array of unsafe regular expressions. If all are safe, 'unsafeRegexes' will be an empty array.
 *
 * @example
 * const durationRegex = /^(\d+(\.\d+)?(ms|s|m|h|d|w|y))$/;
 * const hexRegex = /[\da-f]{128}$/i;
 *
 * const result = isRegexSave(durationRegex, hexRegex, mongodbUriRegex);
 * if (!result.allSafe) {
 * 	result.unsafeRegexes.forEach((regex) => {
 * 		log.error("Unsafe regex:", regex);
 * 	});
 * 	throw createError(500, "One or more regular expressions are not safe.");
 * }
 */
export function isRegexSave(...regexes: RegExp[]): {
  allSafe: boolean;
  unsafeRegexes: RegExp[];
} {
  const unsafeRegexes = regexes.filter((regex) => !safeRegex(regex));
  return {
    allSafe: unsafeRegexes.length === 0,
    unsafeRegexes: unsafeRegexes,
  };
}
