import prisma from "@/config/db/prisma";
import { ENV } from "@/validations/envSchema";
import { Token, TokenType } from "@prisma/client";
import { addDays, addMinutes, getUnixTime } from "date-fns";
import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";

type User = {
  id: string;
  Name: string;
  email: string;
  createdAt: Date | null;
};

// Type guard to check if data is of type User
function isUser(data: {
  id: string;
  Name: string;
  email: string;
  createdAt: Date | null;
}): data is User {
  return data && typeof data === "object" && "id" in data && "email" in data;
}

/**
 * Helper: Delete any existing tokens of the specified type for the given user.
 * @param {string} userId
 * @param {TokenType} type
 */
const deleteExistingTokens = async (
  userId: string,
  type: TokenType,
): Promise<void> => {
  const existingTokens = await prisma.token.findMany({
    where: { userId, tokenType: type },
  });
  if (existingTokens.length > 0) {
    await prisma.token.deleteMany({
      where: { userId, tokenType: type },
    });
    return;
  }
  return;
};

/**
 * Generate token
 * @param {string | User} data - The ID or data of the user for whom the token is being generated.
 * @param {Date} expires - The exact date and time when the token should expire. Used if `expiresIn` is not provided.
 * @param {TokenType} type - The type of the token (e.g., access, refresh).
 * @param {string} [secret] - The secret key used to sign the token. Defaults to ENV.JWT_SECRET.
 * @param {string | number} [expiresIn] - Duration for which the token is valid (e.g., "1h"). Overrides `expires` if provided.
 * @returns {string} - The generated JWT token.
 */
export const generateToken = (
  data: string | User,
  expires: Date,
  type: TokenType,
  secret: string = ENV.JWT_SECRET,
  expiresIn?: string | number,
): string => {
  const payload: JwtPayload = {
    iat: getUnixTime(new Date()),
    exp: expiresIn ? undefined : getUnixTime(expires),
    type,
  };
  if (typeof data === "string") {
    payload.sub = data.toString();
  } else if (isUser(data)) {
    payload.sub = data.id.toString();
    payload.data = {
      id: data.id.toString(),
      email: data.email,
    };
  } else {
    throw new TypeError("Invalid data type for token generation");
  }

  const options: jwt.SignOptions = expiresIn
    ? { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
    : {};
  return jwt.sign(payload, secret, options);
};

/**
 * Save a token (using upsert to prevent multiple tokens with the same type for the same userId)
 * @param {string} token
 * @param {string} userId
 * @param {Date} expires
 * @param {TokenType} type
 * @param {string} email
 * @returns {Promise<Token>}
 */
export const saveToken = async (
  token: string,
  userId: string,
  expires: Date,
  type: TokenType,
  email: string,
): Promise<Token> => {
  const normalizedEmail = email.toLowerCase();
  const tokenCreated = await prisma.token.create({
    data: {
      token,
      email: normalizedEmail,
      userId,
      tokenExpires: expires,
      tokenType: type,
    },
  });
  return tokenCreated;
};

/**
 * Helper function to verify token using JWT.
 */
const verifyTokenHelper = (
  token: string,
  secret: string,
): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decodedPayload) => {
      console.log("decodedPayload", decodedPayload);
      if (err) {
        return reject(
          createHttpError.Unauthorized("Token verification failed"),
        );
      }
      resolve(decodedPayload as JwtPayload);
    });
  });
};

/**
 * Verify token and return token document (or throw an error if it is not valid)
 * @param {string} token
 * @param {TokenType} type
 * @returns {Promise<Token>}
 */
export const verifyToken = async (
  token: string,
  type: TokenType,
): Promise<Token> => {
  const secret = ENV.JWT_SECRET;
  const payload = await verifyTokenHelper(token, secret);
  const tokenDoc = await prisma.token.findFirst({
    where: {
      token,
      tokenType: type,
      userId: payload.sub,
    },
  });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<{ access: { token: string, expires: Date }, refresh: { token: string, expires: Date } }>}
 */
export const generateAuthTokens = async (
  user: User,
): Promise<{
  access: { token: string; expires: Date };
  refresh: { token: string; expires: Date };
}> => {
  const accessTokenExpires = addMinutes(
    new Date(),
    ENV.JWT_ACCESS_EXPIRATION_MINUTES,
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    TokenType.access,
  );

  const refreshTokenExpires = addDays(
    new Date(),
    ENV.JWT_REFRESH_EXPIRATION_DAYS,
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    TokenType.refresh,
  );
  // Upsert will update an existing refresh token if it exists, so no extra deletion is required.
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    TokenType.refresh,
    user.email,
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

/**
 * Generate access token
 * @param {User} user
 * @returns {Promise<{ token: string, expires: Date }>}
 */
export const generateAccessToken = async (
  user: User,
): Promise<{ token: string; expires: Date }> => {
  const accessTokenExpires = addMinutes(
    new Date(),
    ENV.JWT_ACCESS_EXPIRATION_MINUTES,
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    TokenType.access,
  );
  return {
    token: accessToken,
    expires: accessTokenExpires,
  };
};

/**
 * Generate reset password token.
 * First checks if any reset password tokens already exist for the user and deletes them.
 * @param {User} user
 * @returns {Promise<string>}
 */
export const generateResetPasswordToken = async (
  user: User,
): Promise<string> => {
  // Check if reset password token(s) exist and delete them first
  await deleteExistingTokens(user.id, TokenType.password_reset);

  // Generate a new reset password token
  const expires = addMinutes(
    new Date(),
    ENV.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
  );
  const resetPasswordToken = generateToken(
    user.id,
    expires,
    TokenType.password_reset,
  );

  await saveToken(
    resetPasswordToken,
    user.id,
    expires,
    TokenType.password_reset,
    user.email,
  );

  return resetPasswordToken;
};

/**
 * Generate verify email token.
 * First checks if any verify email tokens already exist for the user and deletes them.
 * @param {User} user
 * @returns {Promise<string>}
 */
export const generateVerifyEmailToken = async (user: User): Promise<string> => {
  // Check if verify email token(s) exist and delete them first
  await deleteExistingTokens(user.id, TokenType.email_validation);

  const expires = addMinutes(
    new Date(),
    ENV.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  );
  const verifyEmailToken = generateToken(
    user.id,
    expires,
    TokenType.email_validation,
  );

  await saveToken(
    verifyEmailToken,
    user.id,
    expires,
    TokenType.email_validation,
    user.email,
  );

  return verifyEmailToken;
};
