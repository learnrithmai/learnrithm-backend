import { ENV } from "../../validations/envSchema";
import { SwaggerDefinition, Options } from "swagger-jsdoc";

export const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Express API with Swagger",
    version: "1.0.0",
    description: "A simple Express API application with Swagger documentation",
    license: {
      name: "MIT",
      url: "https://github.com/hagopj13/node-express-boilerplate/blob/master/LICENSE",
    },
  },
  servers: [
    {
      url: `http://localhost:${ENV.PORT}`,
      description: "Development server",
    },
  ],
};

export const swaggerOptions: Options = {
  swaggerDefinition,
  apis: [
    "./src/routes/api/v2/*.ts",
    "./src/config/swagger-docs/swaggerComponent.yml",
  ], // Path to the API docs
};
