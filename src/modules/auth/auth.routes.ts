import express from "express";
import { validate } from "../../middleware/validate";
import { registerSchema, loginSchema } from "./auth.schema";
import { register, login, refresh, logout } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";

const router = express.Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refresh);

router.post("/logout", authenticate, logout);

export default router;
