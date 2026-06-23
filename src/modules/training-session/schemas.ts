import { z } from "zod";

export const sessionSchema = z.object({
  customerId: z.number().int().positive(),
  workoutPlanId: z.number().int().positive().optional(),
  actualStartTime: z.string().optional(),
  actualEndTime: z.string().optional(),
  notes: z.string().optional(),
});
export const updateSessionSchema = z.object({
  actualStartTime: z.string().optional(),
  actualEndTime: z.string().optional(),
  notes: z.string().optional(),
  caloriesBurned: z.number().int().min(0).optional(),
});
export const feedbackSchema = z.object({
  feedback: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5),
});
