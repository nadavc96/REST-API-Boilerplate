import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Middleware factory that validates req.body against a Zod schema
// Usage: router.post('/register', validate(registerSchema), register)
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    // If validation fails, pass the error to the global error handler
    if (!result.success) {
      return next(result.error);
    }

    // Replace req.body with the validated and typed data
    req.body = result.data;
    next();
  };
};
