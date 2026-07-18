import { pool } from "../db/pool";
import redis from "../config/redis";

beforeEach(async () => {
  // Clean tables before each test
  await pool.query("TRUNCATE TABLE users CASCADE");
  // Clear Redis before each test
  await redis.flushAll();
});

afterAll(async () => {
  // Close database connection after all tests
  await pool.end();
  await redis.quit();
});
