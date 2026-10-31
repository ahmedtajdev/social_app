import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { decrBy, exists, expire, incBy } from "../services";
import geoip from "geoip-lite";
import { NextFunction, Request, Response } from "express";

const fromWhere = (ip: string) => {
  if (!ip) return null;
  return geoip.lookup(ip)?.country;
};

export const generateLimiter = ({
  ttl = 15 * 60,
  limit = 100,
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
  standardHeaders = "draft-8",
  statusCode = 429,
  message = "Too many requests, please try again later",
  allowedCountries = ["EG"],
}: {
  ttl?: number;
  limit?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  // legagacyHeaders = boolean;
  standardHeaders?: boolean | "draft-8" | "draft-6" | "draft-7";
  statusCode?: number;
  message?: string;
  allowedCountries?: string[];
}) => {
  return rateLimit({
    windowMs: ttl * 1000,
    // legagacyHeaders,
    standardHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req: Request, res: Response, next: NextFunction) => {
      return res.status(statusCode).json({ message });
    },
    limit: (req: Request) => {
      const country = fromWhere(req.ip as string);
      return allowedCountries.includes(country as string) ? limit : 0;
    },
    keyGenerator: (req: Request) => {
      const ip = ipKeyGenerator(req.ip as string, 52);
      return `${ip}::${req.path}`;
    },
    store: {
      async incr(key, callback) {
        try {
          const count = await incBy({ key });

          if (count === 1) {
            await expire({ key, ttl });
          }

          callback(undefined, count, undefined);
        } catch (error) {
          callback(error as Error, 0, undefined);
        }
      },
      async decrement(key) {
        if (await exists({ key })) {
          await decrBy({ key });
        }
      },
      resetKey: (key: string) => void {},
    },
  });
};
