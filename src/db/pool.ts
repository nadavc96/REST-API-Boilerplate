import { Pool, PoolConfig } from "pg";
import { env } from "../config/env";

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
};

export const pool = new Pool(poolConfig);
