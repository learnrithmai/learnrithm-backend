import { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    metadata?: {
      time: number;
      ip: string | undefined;
      userAgent: string | undefined;
    };
  }
}

/**
 * Middleware function that attaches metadata to the request object.
 * The metadata includes the current time, client's IP address, and user agent.
 *
 * @param {Request} req - The Express Request object. This function adds a `metadata` property to this object.
 * @param {Response} res - The Express Response object. Not used in this function, but included for completeness.
 * @param {NextFunction} next - A callback function to pass control to the next middleware function in the stack.
 * @example
 * // Import the middleware
 * const attachMetadata = require("./middleware/attachMetadata");
 *
 * // Use the middleware
 * app.use(attachMetadata);
 *
 * // In a route handler, access the metadata on the request object
 * app.get("/", (req, res) => {
 *     console.log(req.metadata); // Logs the entire metadata object
 *     console.log('Request Time:', req.metadata.time); // Logs the request time
 *     console.log('Client  IP:', req.metadata.ip); // Logs the client's IP address
 *     console.log('User Agent:', req.metadata.userAgent); // Logs the user agent
 * });
 */
export const attachMetadata = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.metadata = {
    time: Date.now(),
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  next();
};
