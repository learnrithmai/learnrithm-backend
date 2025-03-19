/**
 * Custom error class for API errors.
 *
 * @example
 * // Throwing an API error
 * throw new ApiError(404, "Resource not found");
 *
 * @example
 * // Handling an API error in an Express route
 * app.get('/route', (req, res, next) => {
 *   try {
 *     // Some logic that might throw an error
 *   } catch (error) {
 *     next(new ApiError(500, "Internal Server Error"));
 *   }
 * });
 */
class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  /**
   * Creates an instance of ApiError.
   *
   * @param {number} statusCode - The HTTP status code.
   * @param {string} message - The error message.
   * @param {boolean} [isOperational=true] - Indicates if the error is operational.
   * @param {string} [stack=""] - The stack trace.
   */
  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
