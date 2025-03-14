import createError from "http-errors";
import { Request, Response, NextFunction } from "express";

/**
 * @description Check if the user ID is available in the request object.
 * @param {CustomRequest} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {void}
 */
export const checkUserId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req?.user?.id) {
    return next(new createError.BadRequest("User ID required"));
  }
  next();
};
