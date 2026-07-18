import { Request, Response, NextFunction } from "express";
import redis from "../config/redis";

// Factory function that creates rate limiter middleware
const createRateLimiter = (
  points: number,
  duration: number,
  prefix: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]
      ? req.ip
      : "unknown";
    const key = `${prefix}:${ip}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, duration);
    }

    if (current > points) {
      return res.status(429).json({ error: "Too many requests" });
    }

    next();
  };
};

export const globalRateLimiter = createRateLimiter(100, 15 * 60, "global");
export const authRateLimiter = createRateLimiter(5, 15 * 60, "auth");
