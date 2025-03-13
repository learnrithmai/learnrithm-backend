/* eslint-disable no-var */
declare global {
  var prisma: PrismaClient | undefined;
}
/* eslint-enable no-var */

import { isProd } from "../const";
import { PrismaClient as BasePrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient: RequiredPrismaClient } = require("@prisma/client");
const _PrismaClient: typeof BasePrismaClient = RequiredPrismaClient;

// Extend the base PrismaClient with any customizations.
export class PrismaClient extends _PrismaClient {}

// Create or reuse a PrismaClient instance.
const prismaInstance =
  global.prisma ||
  new PrismaClient({
    omit: {
      user: {
        password: true,
      },
    },
  });

// In non-production, store the client instance globally for hot reloading.
if (!isProd) {
  global.prisma = prismaInstance;
}

export default prismaInstance;
