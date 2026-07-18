import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { env } from "../config/env";

export const getRefreshTokenExpiry = () => {
  return new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
};

export const generateTokens = (userID: string, userEmail: string) => {
  // Access token - short lived
  const accessToken = jwt.sign(
    { userId: userID, email: userEmail },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as StringValue },
  );

  // Refresh token - long lived
  const refreshToken = jwt.sign({ userId: userID }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as StringValue,
  });

  return { accessToken, refreshToken };
};
