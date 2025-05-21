import prisma from "@/config/db/prisma";
import { ENV } from "@/validations/envSchema";
import { Token, TokenType } from "@prisma/client";
import { addDays, addMinutes, getUnixTime } from "date-fns";
import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";

type User = {
  id: string;
  name: string;
  email: string;
  method: string;
  lastLogin: Date | null;
  image: string | null;
  whoAreYou?: string;
  age?: number;
  birthDate?: Date;
  howDidYouFindUs?: string;
};

// Type guard to check if data is of type User
function isUser(data: Partial<User>): data is User {
  return data && typeof data === "object" && "id" in data && "email" in data;
}

/**
 * Helper: Delete any existing tokens of the specified type for the given user.
 * @param userId - User's unique identifier
 * @param type - The token type to delete (e.g., access, refresh, etc.)
 */
const deleteExistingTokens = async (
  userId: string,
  type: TokenType,
): Promise<void> => {
  await prisma.token.deleteMany({
    where: { userId, tokenType: type },
  });
};

/**
 * Generate token.
 * @param data - The user ID or user data for whom the token is generated.
 * @param expires - Exact expiration Date; used if expiresIn is not provided.
 * @param type - The type of the token (access, refresh, etc.)
 * @param secret - Secret key used for signing (defaults to ENV.JWT_SECRET)
 * @param expiresIn - Duration string/number overriding explicit expiration Date.
 * @returns The generated JWT token.
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
    payload.sub = data;
  } else if (isUser(data)) {
    payload.sub = data.id;
    payload.data = {
      id: data.id,
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
 * Save a token.
 * This function always deletes any existing token for the user with the same token type
 * before creating a new record.
 * @param token - The token string
 * @param userId - The user's unique identifier
 * @param expires - Expiration Date of the token
 * @param type - Token type (access, refresh, etc.)
 * @param email - The user's email
 * @returns The created Token document.
 *
 *
 */
export const saveToken = async (
  token: string,
  userId: string,
  expires: Date,
  type: TokenType,
  email: string,
): Promise<Token> => {
  // Remove any previous tokens for this user and token type
  await deleteExistingTokens(userId, type);
  const normalizedEmail = email.toLowerCase();
  return await prisma.token.create({
    data: {
      token,
      email: normalizedEmail,
      userId,
      tokenExpires: expires,
      tokenType: type,
    },
  });
};

/**
 * Helper function to verify a token using JWT.
 */
const verifyTokenHelper = (
  token: string,
  secret: string,
): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decodedPayload) => {
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
 * Verify token and return token document, or throw an error if it is not valid.
 * @param token - The JWT token to verify.
 * @param type - The expected token type.
 * @returns The corresponding Token document.
 */
export const verifyToken = async (
  token: string,
  type: TokenType,
): Promise<Token> => {
  const payload = await verifyTokenHelper(token, ENV.JWT_SECRET);
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
 * Generate auth tokens (access & refresh) for a user.
 * @param user - The user for whom tokens are generated.
 * @returns An object containing access and refresh tokens along with their expiration Dates.
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

  // Ensure any existing refresh tokens are removed before saving a new one.
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    TokenType.refresh,
    user.email,
  );

  return {
    access: { token: accessToken, expires: accessTokenExpires },
    refresh: { token: refreshToken, expires: refreshTokenExpires },
  };
};

/**
 * Generate access token for a user.
 * @param user - The user for whom the token is generated.
 * @returns An object containing the access token and its expiration Date.
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
  return { token: accessToken, expires: accessTokenExpires };
};

/**
 * Generate reset password token.
 * Ensures any existing reset password tokens are deleted before creating a new one.
 * @param user - The user requesting a password reset.
 * @returns The reset password token string.
 */
export const generateResetPasswordToken = async (
  user: User,
): Promise<string> => {
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
 * Ensures any existing verify email tokens are deleted before creating a new one.
 * @param user - The user requesting email verification.
 * @returns The verify email token string.
 */
export const generateVerifyEmailToken = async (user: User): Promise<string> => {
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
