import { pool } from "../db/pool";

beforeEach(async () => {
  // Clean tables before each test
  await pool.query("TRUNCATE TABLE refresh_tokens, users CASCADE");
});

afterAll(async () => {
  // Close database connection after all tests
  await pool.end();
});
