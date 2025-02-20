import notifier from "node-notifier";
import { AxiosErrorDetails, CustomError } from "../../types/errors";
import { Response, Request, NextFunction } from "express";

/**
 * Sends a notification for an error that occurred during an HTTP request.
 *
 * @param {CustomError} err - The custom error object.
 * @param {Request} req - The Express request object.
 * @example
 * const error = new CustomError("Something went wrong", 500);
 * const request = { method: "GET", url: "/api/data" } as Request;
 * errorNotification(error, request);
 */
export function errorNotification(err: CustomError, req: Request) {
    const title = "Error in " + req.method + " " + req.url + " " + err.status;

    notifier.notify({
        title: title,
        message: err.message.toString(),
        sound: true, // Only Notification Center or Windows Toasters
    });
}
