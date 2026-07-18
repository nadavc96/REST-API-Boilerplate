import express from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { validate } from "../../middleware/validate";
import { registerSchema, loginSchema } from "./auth.schema";
import {
  register,
  login,
  refresh,
  logout,
  googleCallBack,
} from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import passport from "../../config/passport";

const router = express.Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);

router.post("/login", authRateLimiter, validate(loginSchema), login);

router.post("/refresh", refresh);

router.post("/logout", authenticate, logout);

//Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/login",
  }),
  googleCallBack,
);

export default router;
