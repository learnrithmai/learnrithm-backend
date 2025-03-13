import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

import { isProd } from "../const";

interface CustomNodeJsGlobal extends Global {
  prisma: typeof PrismaClient;
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
