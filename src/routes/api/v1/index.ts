/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isDev } from "@/config/const";
import prisma from "@/config/db/prisma";
import { swaggerOptions } from "@/config/swagger-docs/swaggerConfig";
import { multerErrorHandler } from "@/middleware/multer/multerErrorHandler";
import { uploadPDF, uploadPDFOptions } from "@/middleware/multer/multerUploader";
import { ENV } from "@/validations/envSchema";
import { enhance } from "@zenstackhq/runtime";
import { RestApiHandler } from "@zenstackhq/server/api";
import { ZenStackMiddleware } from "@zenstackhq/server/express";
import { Request, Response, Router } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import authRouter from "./auth";

import user from "./user";

import auth from "@/middleware/auth/passportJWTAuth";

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

//*  --------- Public routes ---------------

router.use("/auth", authRouter);

// Protect all routes after this middleware
router.use(auth());

//* ---------- Protected routes ------------

router.use("/user", user);

router.route("/upload").post(uploadPDF.single("files"), multerErrorHandler(uploadPDFOptions));

// ------------- ZenStack Middleware ------------

const handler = RestApiHandler({ endpoint: `${ENV.SERVER_API_URL}/model` });

//? https://zenstack.dev/docs/reference/server-adapters/express
router.use(
    "/model",
    ZenStackMiddleware({
        // getSessionUser extracts the current session user from the request, its
        // implementation depends on your auth solution
        getPrisma: (request: Request, res: Response) => {
            if (!request.user) {
                return res.status(401).json({
                    error: "ZenStackMiddleware : User not authenticated , request.user is undefined",
                });
            }
            //@ts-ignore
            return enhance(prisma, { user: request.user });
        },
        zodSchemas: true,
        handler,
    })
);

export default router;
