import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { env } from "../../config/env";
import { AppError } from "../../middleware/AppError";
import { generateTokens, getRefreshTokenExpiry } from "../../utils/jwt";
import { getUserByEmail, saveRefreshToken } from "./auth.repository";
// Helper to set refresh token as httpOnly cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
};

// Register a new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await authService.register(req.body);
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    next(error);
  }
};

// Login with email and password, returns access token and sets refresh token cookie
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accessToken, refreshToken } = await authService.login(req.body);

    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

// Refresh access token using refresh token cookie
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return next(new AppError("No refresh token provided", 401));

    const { accessToken, refreshToken } = await authService.refresh(token);

    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

// Logout - deletes refresh token from db and clears cookie
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return next(new AppError("No refresh token provided", 401));

    await authService.logout(token);
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const googleCallBack = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as { id: string; email: string };

    if (!user) return next(new AppError("Authentication failed", 401));

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    await saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry());
    setRefreshTokenCookie(res, refreshToken);

    // Redirects to frontend with access token
    // Change this to res.redirect(`${env.FRONTEND_URL}?accessToken=${accessToken}`) in production
    res.status(200).send({ accessToken });
  } catch (error) {
    next(error);
  }
};
