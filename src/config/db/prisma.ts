import { isProd } from "../const";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
path.dirname(__filename);

interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient;
}

declare const global: CustomNodeJsGlobal;

const prisma =
  global.prisma ||
  new PrismaClient({
    omit: {
      user: {
        password: true,
      },
    },
  });

if (!isProd) {
  global.prisma = prisma;
}

export default prisma;
