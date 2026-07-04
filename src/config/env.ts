import { z } from "zod";
import logger from "./logger";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  ALLOWED_ORIGINS: z
    .string()
    .min(1, "ALLOWED_ORIGINS cannot be empty")
    .transform((val) => val.split(",")),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),
});

const parsedSchema = envSchema.safeParse(process.env);

if (!parsedSchema.success) {
  console.error("Missing environment variables", parsedSchema.error);
  process.exit(1);
}

export const env = parsedSchema.data;
