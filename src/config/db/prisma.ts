import path from "path";
import { fileURLToPath } from 'url';
import { isProd } from "../const";
import { PrismaClient } from "@prisma/client";

path.dirname(fileURLToPath(import.meta.url));

// Set Prisma Query Engine Path (optional)
process.env.PRISMA_QUERY_ENGINE_BINARY = path.join(
  process.cwd(),
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
