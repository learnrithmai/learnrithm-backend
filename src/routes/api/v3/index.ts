import { isDev } from "@/config/const";
import { swaggerOptions } from "@/config/swagger-docs/swaggerConfig";
import { multerErrorHandler } from "@/middleware/multer/multerErrorHandler";
import {
  uploadPDF,
  uploadPDFOptions,
} from "@/middleware/multer/multerUploader";
import { Router } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import google from "./google";

const router = Router();

const specs = swaggerJsdoc(swaggerOptions);

if (isDev) {
  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
    }),
  );
  // router.use("/test", require("./test"));
}

//* ---------- Protected routes ------------
router.use("/google", google);


router
  .route("/upload")
  .post(uploadPDF.single("files"), multerErrorHandler(uploadPDFOptions));

export default router;
