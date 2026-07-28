import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(["ADMIN", "USER", "MANAGER"]),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
