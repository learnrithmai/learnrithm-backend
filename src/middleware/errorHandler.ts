import axios from "axios";
import { isDev } from "@/config/const";
import { errorNotification } from "@/config/logging/notifier";
import log from "@/utils/chalkLogger";
import { Response, Request } from "express";
import { AxiosErrorDetails, CustomError } from "@/types/errors";

/**
 * Error handling middleware for Express.
 *
 * @param {CustomError} err - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {void}
 * @example
 * import express from 'express';
 * import { errorHandler } from './middleware/errorHandler';
 *
 * const app = express();
 *
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
): void => {
  // Use the status property of the error, or default to 500
  const statusCode = err.status || Number(err?.response?.status) || 500;
  let axiosErrors: AxiosErrorDetails = {};
  log.error("Error", "🧨");
  console.error(err.stack);

  // Check if this is an Axios error
  if (axios.isAxiosError(err)) {
    // Log additional details from the Axios error
    const axiosErrorDetails: AxiosErrorDetails = {
      url: err.config?.url,
      method: err.config?.method,
      statusCode: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
    };
    console.error("Axios Error Details:", axiosErrorDetails);
    axiosErrors = axiosErrorDetails;
  }

  if (isDev) errorNotification(err, req);
  // Set the response status code to the error status code
  // Only send the error message to the client in development environment
  const message = isDev
    ? axiosErrors || err.message
    : statusCode >= 500
      ? "Internal Server Error"
      : "An error occurred";

  // save the error message in res.locals to be used in the error logging middleware (morgan)
  res.locals.errorMessage = err.message;

  res.status(statusCode).send(message);
};
