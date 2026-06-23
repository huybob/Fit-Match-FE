import { z } from "zod";
export const workoutPlanSchema = z.object({
  customerId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  exercises: z.array(z.object({ name: z.string().min(1), sets: z.number().int().positive().optional(), reps: z.number().int().positive().optional(), weight: z.string().optional(), durationMin: z.number().int().positive().optional(), notes: z.string().optional() })).min(1),
}).refine((value) => value.endDate >= value.startDate, { path: ["endDate"] });
