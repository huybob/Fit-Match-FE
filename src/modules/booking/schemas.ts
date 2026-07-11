import { z } from "zod";

export const createBookingSchema = z.object({
  ptId: z.number().int().positive({ message: "Vui lòng chọn huấn luyện viên" }),
  bookingDate: z.string().min(1).refine((value) => value >= new Date().toISOString().slice(0, 10), { message: "Ngày không hợp lệ" }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  note: z.string().optional(),
});
export const cancelBookingSchema = z.object({ reason: z.string().max(500) });
