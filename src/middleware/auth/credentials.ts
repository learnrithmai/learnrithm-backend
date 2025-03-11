import { ENV } from "@/validations/envSchema";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to handle credentials for CORS requests.
 * Adds the "Access-Control-Allow-Credentials" header if the request origin is allowed.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 * @example
 * import express from 'express';
 * import { credentials } from './credentials';
 *
 * const app = express();
 * app.use(credentials);
 */
export const credentials = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const origin = req.headers.origin as string;
  if (ENV.ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", "true");
  }
  next();
};
