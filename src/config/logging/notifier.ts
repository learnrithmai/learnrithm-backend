import notifier from "node-notifier";
import { CustomError } from "../../types/errors";
import { Request } from "express";

/**
 * Sends a system notification for an error that occurred during an HTTP request.
 * 
 * @param {CustomError} err - The custom error object.
 * @param {Request} req - The Express request object.
 * @param {Partial<notifier.Notification>} [options] - Optional notifier configuration overrides.
 *
 * @example
 * const error = new CustomError("Something went wrong", 500);
 * errorNotification(error, req, { wait: true });
 */
export function errorNotification(
  err: CustomError,
  req: Request,
  options: Partial<notifier.Notification> = {}
): void {
  const title = `Error in ${req.method} ${req.url} [Status: ${err.status ?? 500}]`;
  const errorMessage =
    typeof err?.message === "string" ? err.message : "Unknown error occurred";

  notifier.notify(
    {
      title,
      message: errorMessage,
      sound: true, // Enables sound notification if supported
      wait: false, // Does not wait for user action by default
      ...options, // Spread in any additional options to override defaults
    },
    (notificationError) => {
      if (notificationError) {
        console.error("Notification error:", notificationError);
      }
    }
  );
}