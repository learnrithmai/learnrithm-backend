import path from "path";
import { isProd } from "../const";
import { PrismaClient } from "@prisma/client";
import { __dirname } from "@/config/const";

// Set Prisma Query Engine Path (optional)
process.env.PRISMA_QUERY_ENGINE_BINARY = path.join(
  __dirname,
  "node_modules/.prisma/client/query-engine-darwin",
);

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
