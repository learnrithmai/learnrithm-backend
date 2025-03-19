/*

| Key | Description | Note |
| --- | --- | --- |
| `fieldname` | Field name specified in the form |  |
| `originalname` | Name of the file on the user's computer |  |
| `encoding` | Encoding type of the file |  |
| `mimetype` | Mime type of the file |  |
| `size` | Size of the file in bytes |  |
| `destination` | The folder to which the file has been saved | `DiskStorage` |
| `filename` | The name of the file within the `destination` | `DiskStorage` |
| `path` | The full path to the uploaded file | `DiskStorage` |
| `buffer` | A `Buffer` of the entire file | `MemoryStorage` |

*/

import { mbToByte } from "@/utils";
import { fileFilterPDF, fileFilterPost } from "@/utils/multerUtils";
import multer, { StorageEngine } from "multer";
import path from "node:path";
import fs from "node:fs";

const MAX_FILE_SIZE_PDF_MB = 4;
const MAX_FILE_SIZE_POST_MB = 2;

export const PDF_DIR = "/app/docs";
export const POSTS_DIR = "public/posts";

// Function to generate a unique filename
export const getUniqueFilename = (file: Express.Multer.File): string => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
};

// Function to create directory if it doesn't exist
export const ensureDirExists = (dirPath: string): void => {
  const dir = path.join(process.cwd(), dirPath);
  fs.mkdirSync(dir, { recursive: true });
};

//? -------- Storage Config -------------

const storagePDF: StorageEngine = multer.diskStorage({
  //* If no destination is given, the operating system's default directory for temporary files is used.
  destination: function (req, file, cb) {
    ensureDirExists(PDF_DIR);
    cb(null, PDF_DIR);
  },
  //* If no filename is given, each file will be given a random name that doesn't include any file extension.
  filename: function (req, file, cb) {
    cb(null, getUniqueFilename(file));
  },
});

const storagePost: StorageEngine = multer.diskStorage({
  //* If no destination is given, the operating system's default directory for temporary files is used.
  destination: function (req, file, cb) {
    ensureDirExists(POSTS_DIR);
    cb(null, POSTS_DIR);
  },
  //* If no filename is given, each file will be given a random name that doesn't include any file extension.
  filename: function (req, file, cb) {
    cb(null, getUniqueFilename(file));
  },
});

//? --------- uploader middleware config ----------

export const uploadPDFOptions: multer.Options = {
  storage: storagePDF,
  limits: { fileSize: mbToByte(MAX_FILE_SIZE_PDF_MB) },
  fileFilter: fileFilterPDF,
};
export const uploadPDF = multer(uploadPDFOptions);

export const uploadPostOptions: multer.Options = {
  storage: storagePost,
  limits: { fileSize: mbToByte(MAX_FILE_SIZE_POST_MB) },
  fileFilter: fileFilterPost,
};
export const uploadPost = multer(uploadPostOptions);
