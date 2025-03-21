import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import path, { join } from "node:path";
import passport from "passport";
import { swaggerOptions } from "./config/swagger-docs/swaggerConfig";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { credentials } from "./middleware/auth/credentials";
import { helmetOptions } from "./config/security/helmetOptions";
import { corsOptions } from "./config/security/corsOptions";
import { rateLimiterMiddleware } from "./middleware/rateLimiter/rateLimiter";
import cookieParser from "cookie-parser";
import compression from "compression";
import { attachMetadata } from "./middleware/attachMetadata";
import { jwtStrategy } from "./config/auth/passportjsConfig";
import prisma from "./config/db/prisma";
import { ENV } from "./validations/envSchema";
import logger from "./utils/chalkLogger";
import apiV1Routes from "@routes/api/v1";
import { errorHandler } from "./middleware/errorHandler";
import {
  morganErrorHandler,
  morganSuccessHandler,
} from "./config/logging/morganConfig";

dotenv.config();

const app: Application = express();

// Trust Proxy for Proxies (Heroku, Render.com, Docker behind Nginx, etc)
// https://stackoverflow.com/questions/40459511/in-express-js-req-protocol-is-not-picking-up-https-for-my-secure-link-it-alwa
app.set("trust proxy", true);

// Set security HTTP headers
app.use(helmet(helmetOptions));

// Generate Swagger specification from your config
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Mount Swagger UI at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//? Morgan console logger

//* 1. defualt morgan logger
app.use(morgan("dev"));

//* 2. morgan logger with winston
app.use(morganSuccessHandler);
app.use(morganErrorHandler);

// Handle options credentials check - before CORS!
// Set the "Access-Control-Allow-Credentials" header if the request origin is allowed.
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// Global RateLimiter : limits number of actions by key and protects from DDoS and brute force attacks at any scale.
app.use(rateLimiterMiddleware);

//  parse urlencoded request body
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// parse json request body
app.use(express.json({ limit: "1mb" }));

// middleware for cookies
// allows you to access cookie values via req.cookies.
app.use(cookieParser());

// attach metadata (req time , IP , user agent) to request object
app.use(attachMetadata);

// Compress response bodies
app.use(compression());

// Serve static files
app.use(express.static(join(__dirname, "public")));

// disable "x-powered-by Express" in the req header
app.disable("x-powered-by");

//? Auth
//* PassportJS JWT authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// Serve static files from the "static" folder
app.use(express.static(path.join(__dirname, "../public", "static")));

// Default route - serve the HTML page with the image and text
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public", "static", "index.html"));
});

//APIs Consume
app.use("/api/v1", apiV1Routes);

// global error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to the MongoDB database
    await prisma.$connect();
    console.log("Connected to MongoDB .... 🐲");
    // Manually log the database connection details
    const DatabaseInfo = {
      "DB Name": ENV.DB_NAME,
      User: ENV.DB_USER,
      Host: ENV.DB_HOST,
      Port: ENV.DB_PORT,
    };
    console.table(DatabaseInfo);

    // Start the server
    app.listen(process.env.PORT || 5000, () =>
      logger.database(`Server running on port `, `${process.env.PORT || 5000}`),
    );
  } catch (error) {
    logger.error("Failed to connect to the database", error as string);
    process.exit(1);
  }
}

(async () => {
  await startServer();
})();
