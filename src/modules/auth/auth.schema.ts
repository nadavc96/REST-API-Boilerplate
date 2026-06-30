import { z } from "zod";

// Add or remove fields based on your needs
export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
