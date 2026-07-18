import { createClient } from "redis";
import { env } from "./env";
import logger from "./logger";

// Add or remove events based on your needs

const redis = createClient({ url: env.REDIS_URL });

// Fires when Redis connection is established
redis.on("connect", () => {
  logger.info("Redis connected");
});

// Fires on connection errors
redis.on("error", (err) => {
  logger.error("Redis connection error", { err });
});

redis.connect();

export default redis;
