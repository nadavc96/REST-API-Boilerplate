import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import {
  getUserByEmail,
  createUser,
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  getUserByID,
  deleteUserExpiredTokens,
} from "./auth.repository";
import { LoginInput, RegisterInput } from "./auth.schema";
import { AppError } from "../../middleware/AppError";
import { getRefreshTokenExpiry, generateTokens } from "../../utils/jwt";

const SALT_ROUNDS = 10;

export const register = async (input: RegisterInput) => {
  //validate email
  const emailIsUsed =
    (await getUserByEmail(input.email)) === null ? false : true;
  if (emailIsUsed) throw new AppError("Email already in use", 409);

  //hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await createUser(input.email, passwordHash);

  return user;
};

export const login = async (input: LoginInput) => {
  const user = await getUserByEmail(input.email);

  if (!user) throw new AppError("Email or password is wrong", 401);

  const passwordMatch = await bcrypt.compare(
    input.password,
    user.password_hash,
  );

  if (!passwordMatch) throw new AppError("Email or password is wrong", 401);

  await deleteUserExpiredTokens(user.id);

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);
  //save token to the DB
  await saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry());
  return { accessToken, refreshToken };
};

export const refresh = async (token: string) => {
  const currentToken = await getRefreshToken(token);

  if (!currentToken) throw new AppError("Invalid refresh token.", 401);

  if (currentToken.expires_at < new Date())
    throw new AppError("Refresh token expired", 401);

  jwt.verify(token, env.JWT_SECRET);

  const user = await getUserByID(currentToken.user_id);

  await deleteRefreshToken(token);

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);
  //save token to the DB
  await saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry());
  return { accessToken, refreshToken };
};

export const logout = async (token: string) => {
  const deleted = await deleteRefreshToken(token);
  if (!deleted) throw new AppError("Invalid refresh token", 401);
};
