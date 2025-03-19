import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rateLimiterRes = await rateLimiter.consume(req.ip || "unknown");
    res.setHeader("Retry-After", rateLimiterRes.msBeforeNext / 1000);
    res.setHeader("X-RateLimit-Limit", 10);
    res.setHeader("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
    );
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    } else {
      const rateLimiterRes = error as RateLimiterRes; // Explicitly cast error
      res.setHeader("Retry-After", rateLimiterRes.msBeforeNext / 1000);
      res.setHeader("X-RateLimit-Limit", 10);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
      );
      res.status(429).send("Too Many Requests");
    }
  }
};
