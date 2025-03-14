import log from "@/utils/chalkLogger";
import { byteToMb } from "@/utils";
import { MulterError, Options } from "multer";
import { Response, NextFunction } from "express";

/**
 * Middleware to handle Multer errors.
 *
 * @param {Options} upload - The Multer upload options.
 * @returns {Function} Middleware function to handle errors.
 * @example
 * import multer from 'multer';
 * const uploadOptions = { dest: 'uploads/', limits: { fileSize: 1024 * 1024 } };
 * const upload = multer(uploadOptions);
 * app.post('/upload', upload.single('file'), multerErrorHandler(uploadOptions));
 */
export const multerErrorHandler = (upload: Options) => {
  return (err: unknown, res: Response, next: NextFunction): void => {
    if (err instanceof MulterError) {
      let message = err.message;
      console.log(err);
      log.error(JSON.stringify(err));
      log.info(JSON.stringify(upload));
      switch (err.code) {
        case "LIMIT_FILE_SIZE": {
          const fileSizeLimitInMB = byteToMb(
            upload?.limits?.fileSize as number,
          );
          message = `File too large. Maximum allowed size is ${fileSizeLimitInMB}MB`;
          break;
        }
        case "LIMIT_PART_COUNT": {
          message = `Too many fields. Maximum allowed is ${upload?.limits?.fields}.`;
          break;
        }
        case "LIMIT_FILE_COUNT": {
          message = `Too many files. Maximum allowed is ${upload?.limits?.files}.`;
          break;
        }
        case "LIMIT_FIELD_KEY": {
          message = `Field name too long. Maximum allowed length is ${upload?.limits?.fieldNameSize}.`;
          break;
        }
        case "LIMIT_FIELD_VALUE": {
          message = `Field value too long. Maximum allowed length is ${upload?.limits?.fieldSize}.`;
          break;
        }
        case "LIMIT_FIELD_COUNT": {
          message = `Too many fields. Maximum allowed is ${upload?.limits?.fields}.`;
          break;
        }
        case "LIMIT_UNEXPECTED_FILE": {
          message = `Unexpected field Name , ex: upload.single||array("field-name")`;
          break;
        }
        default: {
          // Unexpected server error
          res.status(500).send(message);
          break;
        }
      }
      res.status(400).send(message);
    } else {
      // Other errors
      next(err);
    }
  };
};
