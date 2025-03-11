import prisma from "@/config/db/prisma";
import log from "@/utils/chalkLogger";
import { NextFunction, Request, Response } from "express";
import { RateLimiterPrisma, RateLimiterRes } from "rate-limiter-flexible";

/* //* Storage options:
	//* Memory : https://github.com/animir/node-rate-limiter-flexible/wiki/Memory
	//* Memory Cash : https://github.com/animir/node-rate-limiter-flexible/wiki/Memcache

//* All possible methods here :
	//* https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#minimal-protection-against-password-brute-force
	//* https://medium.com/@animirr/brute-force-protection-node-js-examples-cd58e8bd9b8d#e516
*/

const rateLimiter = new RateLimiterPrisma({
    storeClient: prisma,
    points: 10, // 40 requests
    duration: 60, // per 60 second by IP
});

/**
 * Middleware to handle rate limiting using RateLimiterMongo.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 * @example
 * import express from 'express';
 * import { rateLimiterMiddleware } from './rateLimiter';
 *
 * const app = express();
 * app.use(rateLimiterMiddleware);
 */
export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const rateLimiterRes: RateLimiterRes = await rateLimiter.consume(req.ip || ""); // Consume 1 point for each request
        log.debug("RateLimit-Limit Response .....");
        console.log(rateLimiterRes);
        res.setHeader("Retry-After", rateLimiterRes.msBeforeNext / 1000);
        res.setHeader("X-RateLimit-Limit", rateLimiter.points);
        res.setHeader("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
        res.setHeader("X-RateLimit-Reset", new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

        next();
    } catch (rateLimiterRes) {
        if (rateLimiterRes instanceof RateLimiterRes) {
            log.warning("RateLimit-Limit Error .....");
            console.log(rateLimiterRes);

            res.setHeader("Retry-After", rateLimiterRes.msBeforeNext / 1000);
            res.setHeader("X-RateLimit-Limit", String(rateLimiter?.points));
            res.setHeader("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
            res.setHeader("X-RateLimit-Reset", new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

            log.error("rate-limiter-flexible : ", "Too Many Requests");
            res.status(429).send("Too Many Requests");
        } else {
            // Handle other types of errors
            console.error(rateLimiterRes);
            res.status(500).send("Internal Server Error");
        }
    }
};
