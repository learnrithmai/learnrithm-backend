import path from "node:path";
import { Request } from "express";
import { FileFilterCallback } from "multer";

/**
 * Type representing a custom request object that extends the Express request object.
 */
type CustomRequest = Request & { acceptedFileTypes?: RegExp };

/**
 * Middleware function for Multer that filters files based on their mimetype.
 * If the file's mimetype starts with "image/", it passes the file to the next middleware.
 * Otherwise, it throws an error.
 *
 * @param {CustomRequest} req - The Express request object.
 * @param {Express.Multer.File} file - The file object.
 * @param {FileFilterCallback} cb - The callback to be invoked when the file has been processed.
 * @returns {void}
 */
export const fileFilterPost = (
  req: CustomRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  // reject a file
  req.acceptedFileTypes = /jpeg|jpg|png|webp/;
  const mimetype = req.acceptedFileTypes.test(file.mimetype);
  const extname = req.acceptedFileTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type. Only ${req.acceptedFileTypes.toString()} are allowed.`,
    ),
  );
};

/**
 * Middleware function for Multer that filters files based on their mimetype and extension.
 * If the file's mimetype and extension are accepted, it passes the file to the next middleware.
 * Otherwise, it throws an error.
 *
 * @param {CustomRequest} req - The Express request object.
 * @param {MulterFile} file - The file object.
 * @param {FileFilterCallback} cb - The callback to be invoked when the file has been processed.
 * @returns {void}
 */
export const fileFilterPDF = (
  req: CustomRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  // Check if the file is a PDF
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};
