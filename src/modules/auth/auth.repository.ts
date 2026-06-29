import { pool } from "../../db/pool";

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

export const getRefreshToken = async (token: string) => {
  const userToken = await pool.query(
    `SELECT id, user_id, token, expires_at
    FROM refresh_tokens
    WHERE token=$1`,
    [token],
  );

  return userToken.rows[0] || null;
};

export const saveRefreshToken = async (
  userID: string,
  token: string,
  expiresAt: Date,
) => {
  // Returns the saved token row
  const result = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, expires_at`,
    [userID, token, expiresAt],
  );

  return result.rows[0];
};

export const deleteRefreshToken = async (token: string) => {
  // Returns true if deleted, false if token not found
  const result = await pool.query(
    `DELETE FROM refresh_tokens
        WHERE token=$1`,
    [token],
  );

  return (result.rowCount ?? 0) > 0;
};

export const deleteUserExpiredTokens = async (userId: string) => {
  await pool.query(
    `DELETE FROM refresh_tokens
     WHERE user_id=$1 AND expires_at < NOW()`,
    [userId],
  );
};
