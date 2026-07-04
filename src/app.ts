import express, { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import authRouter from "./modules/auth/auth.routes";
import logger from "./config/logger";

const app = express();

//Security headers
app.use(helmet());

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  }),
);

// HTTP request logging
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }),
);

//Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

/* DEFINE YOUR ROUTES HERE */

app.use("/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

//Global error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues });
  }

  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack });
  } else logger.error("Unknown error", { err });

  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
};

app.use(errorHandler);

export default app;
