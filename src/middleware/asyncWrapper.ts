import { Response, Request, NextFunction } from "express";

/**
 * Wrap asynchronous functions to handle errors.
 *
 * @param {function(Request, Response, NextFunction): Promise<any>} fn - The asynchronous function to wrap.
 * @returns {function(Request, Response, NextFunction): Promise<any>} The wrapped function.
 * @example
 * import express from 'express';
 * import { asyncWrapper } from './asyncWrapper';
 *
 * const app = express();
 *
 * const asyncRoute = asyncWrapper(async (req, res, next) => {
 *   const data = await someAsyncFunction();
 *   res.json(data);
 * });
 *
 * app.get('/async-route', asyncRoute);
 */
export const asyncWrapper = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next))
      .then(() => undefined)
      .catch(next);
  };
};
