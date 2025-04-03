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
// import ngrok from "@ngrok/ngrok";
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
import apiV2Routes from "@routes/api/v2";
import { errorHandler } from "./middleware/errorHandler";
import {
  morganErrorHandler,
  morganSuccessHandler,
} from "./config/logging/morganConfig";


dotenv.config();

const app: Application = express();

// Trust Proxy for Proxies (Heroku, Render.com, Docker behind Nginx, etc)
app.set("trust proxy", true);

// Set security HTTP headers
app.use(helmet(helmetOptions));

// Generate Swagger specification from your config
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Mount Swagger UI at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//? Morgan console logger
app.use(morgan("dev"));
app.use(morganSuccessHandler);
app.use(morganErrorHandler);

// Handle options credentials check - before CORS!
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// Global RateLimiter to protect against DDoS and brute force attacks.
app.use(rateLimiterMiddleware);

// Parse urlencoded and json request bodies
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(express.json({ limit: "1mb" }));

// Middleware for cookies
app.use(cookieParser());

// Attach metadata (req time, IP, user agent) to request object
app.use(attachMetadata);

// Compress response bodies
app.use(compression());

// Serve static files
app.use(express.static(join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "../public/static")));

// Disable "x-powered-by Express" in the request header
app.disable("x-powered-by");

// PassportJS JWT authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// Default route - serve the HTML page with the image and text
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/static/index.html"));
});

// API routes
app.use("/api/v2", apiV2Routes);

// Global error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to the MongoDB database
    await prisma.$connect();
    console.log("Connected to MongoDB .... 🐲");

    // Log database connection details
    const DatabaseInfo = {
      "DB Name": ENV.DB_NAME,
      User: ENV.DB_USER,
      Host: ENV.DB_HOST,
      Port: ENV.DB_PORT,
    };
    console.table(DatabaseInfo);

    // Determine port
    const port = process.env.PORT || 5000;


    // Start the server
    app.listen(port, () =>
      logger.database(`Server running on port `, `${port}`)
    );

    // // Expose your local server via ngrok
    // const publicUrl = await ngrok.connect({
    //   addr: port,
    //   authtoken_from_env: true,
    // });
    // logger.info(`ngrok tunnel established at: ${publicUrl.url()}`);
  } catch (error) {
    logger.error("Failed to connect to the database", error as string);
    process.exit(1);
  }
}

(async () => {
  await startServer();
})();