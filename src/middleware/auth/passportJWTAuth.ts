import passport, { AuthenticateCallback } from "passport";
import createHttpError from "http-errors";
import { roleRights } from "@/config/const";
import { Request, Response, NextFunction } from "express";

declare global {
    namespace Express {
        interface User {
            role: string;
            id: string;
        }
    }
}

/**
 * Verify callback for passport authentication.
 *
 * @param {Request} req - Express request object.
 * @param {Function} resolve - Function to resolve the promise.
 * @param {Function} reject - Function to reject the promise.
 * @param {string[]} requiredRights - Array of required rights.
 * @returns {Function} - A function to handle the verification.
 *
 * @example
 * passport.authenticate("jwt", { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
 */
const verifyCallback =
    (
        req: Request,
        resolve: (value?: unknown) => void,
        reject: (reason?: any) => void,
        requiredRights: string[]
    ): AuthenticateCallback =>
        async (err, user, info): Promise<void> => {
            if (err || info || !user) {
                return reject(createHttpError.Unauthorized("Please authenticate"));
            }

            if (requiredRights.length > 0) {
                const userRights = roleRights.get(user.role) || [];
                const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
                if (!hasRequiredRights && req.params.userId !== user.id) {
                    return reject(createHttpError.Forbidden("Forbidden"));
                }
            }

            resolve();
        };

/**
 * Middleware to authenticate and authorize users based on JWT and required rights.
 *
 * @param {...string[]} requiredRights - Array of required rights.
 * @returns {Function} - Express middleware function.
 *
 * @example
 * app.get('/protected-route', auth('read', 'write'), (req, res) => {
 *   res.send('This is a protected route');
 * });
 */
const auth =
    (...requiredRights: string[]): ((req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            return new Promise((resolve, reject) => {
                passport.authenticate("jwt", { session: false }, verifyCallback(req, resolve, reject, requiredRights))(
                    req,
                    res,
                    next
                );
            })
                .then(() => next())
                .catch((error: any) => next(error));
        };

export default auth;
