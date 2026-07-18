import { pool } from "../../db/pool";
import redis from "../../config/redis";

// Add your own queries here as your app grows

export const createUser = async (email: string, passwordHash: string) => {
  // Returns the created user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, created_at`,
    [email, passwordHash],
  );

  return result.rows[0];
};

export const getUserByEmail = async (email: string) => {
  // Returns null if user not found
  const result = await pool.query(
    `SELECT id, email, password_hash, created_at
    FROM users
    WHERE email=$1`,
    [email],
  );

  return result.rows[0] || null;
};

export const getUserByID = async (id: string) => {
  // Returns null if user not found
  const result = await pool.query(
    `SELECT id, email, password_hash, created_at
    FROM users
    WHERE id=$1`,
    [id],
  );

  return result.rows[0] || null;
};

export const getUserIdByRefreshToken = async (token: string) => {
  return await redis.get(`refreshToken:${token}`);
};

export const saveRefreshToken = async (
  userID: string,
  token: string,
  expiresAt: Date,
) => {
  //Saves refresh token to Redis with automatic expiry
  const seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  await redis.set(`refreshToken:${token}`, userID, { EX: seconds });
};

export const deleteRefreshToken = async (token: string) => {
  // Returns true if deleted, false if token not found
  const result = await redis.del(`refreshToken:${token}`);

  return result > 0;
};
