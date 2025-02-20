import { isProd } from "../const";
import { PrismaClient } from "@prisma/client";
// import { enhance } from "@zenstackhq/runtime";
// import {  Request, Response } from "express";

interface CustomNodeJsGlobal extends Global {
    prisma: PrismaClient;
}

declare const global: CustomNodeJsGlobal;

// const prisma = global.prisma || new PrismaClient({ log: ['info'] });
// const prisma =
//     global.prisma ||
//     enhance(new PrismaClient(),{ user: (req : Request) => req.user });
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
