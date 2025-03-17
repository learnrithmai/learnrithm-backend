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
import authRouter from "./auth";
import userRouter from "./user";
import chatRouter from "./chat";

const router = Router();

//* --------  Swagger docs -----------------
const specs = swaggerJsdoc(swaggerOptions);

if (isDev) {
  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
    })
  );
  // router.use("/test", require("./test"));
}

router.use("/chat", chatRouter);

//*  --------- Public routes ---------------
router.use("/auth", authRouter);

//* ---------- Protected routes ------------
router.use("/user", userRouter);

router
  .route("/upload")
  .post(uploadPDF.single("files"), multerErrorHandler(uploadPDFOptions));

export default router;
