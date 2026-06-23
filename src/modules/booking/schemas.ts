import { z } from "zod";

export const createBookingSchema = z.object({
  branchId: z.number().int().positive(),
  ptServiceId: z.number().int().positive(),
  bookingDate: z.string().min(1).refine((value) => value >= new Date().toISOString().slice(0, 10)),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().optional(),
});
export const cancelBookingSchema = z.object({ reason: z.string().max(500) });
