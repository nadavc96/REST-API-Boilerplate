import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { env } from "../../config/env";

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
    const { email, password } = req.body;

    await authService.register(email, password);
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
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await authService.login(
      email,
      password,
    );

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
    if (!token) return next(new Error("No refresh token provided"));

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
    if (!token) return next(new Error("No refresh token provided"));

    await authService.logout(token);
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
