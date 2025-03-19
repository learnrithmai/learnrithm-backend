import morgan, { StreamOptions } from "morgan";
import { isProd } from "../const";
import winstonLogger from "../logging/winstonConfig";
import { Request, Response } from "express";
/**
 * Custom token to log error messages.
 */
morgan.token(
  "message",
  (req: Request, res: Response) => res.locals.errorMessage || "",
);

/**
 * Get IP format based on environment.
 * @returns {string} IP format string.
 */
const getIpFormat = (): string => (isProd ? ":remote-addr - " : "");

/**
 * Success response format string.
 */
const successResponseFormat: string = `${getIpFormat()}:method :url :status - :response-time ms`;

/**
 * Error response format string.
 */
const errorResponseFormat: string = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

/**
 * Morgan success handler.
 * @example
 *  const morgan = require('./config/morgan');
 *  app.use(morgan.successHandler);
 */
export const morganSuccessHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: {
    write: (message: string) => winstonLogger.info(message.trim()),
  } as StreamOptions,
});

/**
 * Morgan error handler.
 * @example
 * const morgan = require('./config/morgan');
 * app.use(morgan.errorHandler);
 */
export const morganErrorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message: string) => winstonLogger.error(message.trim()),
  } as StreamOptions,
});
