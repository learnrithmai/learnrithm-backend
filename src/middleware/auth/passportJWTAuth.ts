import passport, { AuthenticateCallback } from "passport";
import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import logger from "@/utils/chalkLogger";

// Removed roleRights import because roles are no longer used.

declare global {
  export interface User {
    id: string;
  }
}

/**
 * Verify callback for passport authentication.
 *
 * @param {Request} req - Express request object.
 * @param {Function} resolve - Function to resolve the promise.
 * @param {Function} reject - Function to reject the promise.
 * @returns {Function} - A function to handle the verification.
 *
 * @example
 * passport.authenticate("jwt", { session: false }, verifyCallback(req, resolve, reject))(req, res, next);
 */
const verifyCallback =
  (
    req: Request,
    resolve: (value?: unknown) => void,
    reject: (reason?: Error) => void,
  ): AuthenticateCallback =>
    async (err, user, info): Promise<void> => {
      if (err || info || !user) {
        return reject(createHttpError.Unauthorized("Please authenticate"));
      }

      // Only check that a user exists.
      resolve();
    };

/**
 * Middleware to authenticate users based on JWT.
 *
 * @returns {Function} - Express middleware function.
 *
 * @example
 * app.get('/protected-route', auth(), (req, res) => {
 *   res.send('This is a protected route');
 * });
 */
const auth =
  (): ((req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      return new Promise((resolve, reject) => {
        passport.authenticate(
          "jwt",
          { session: false },
          verifyCallback(req, resolve, reject),
        )(req, res, next);
      })
        .then(() => next())
        .catch((error: unknown) => {
          logger.error("Chat generation error:", error as string);
          res.status(500).json({
            errorMsg: "User creation failed",
            details: error instanceof Error ? error.message : error,
          })
        });
    };

export default auth;
