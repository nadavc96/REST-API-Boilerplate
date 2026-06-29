import { z } from "zod";

// Add or remove fields based on your needs
const loginSchema = z.object({
  identifier: z.email(),
  password: z.string(),
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
