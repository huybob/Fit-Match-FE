import { z } from "zod";

/** UC-031/032: chọn gym + đúng một trong dịch vụ/gói + khung giờ. */
export const createBookingSchema = z
  .object({
    gymId: z.number().int().positive({ message: "Vui lòng chọn phòng gym" }),
    itemType: z.enum(["service", "package"]),
    itemId: z.number().int().positive({ message: "Vui lòng chọn dịch vụ hoặc gói tập" }),
    branchId: z.number().int().positive().optional(),
    ptId: z.number().int().positive().optional(),
    bookingDate: z
      .string()
      .min(1, { message: "Vui lòng chọn ngày" })
      .refine((value) => value >= new Date().toISOString().slice(0, 10), {
        message: "Ngày không hợp lệ",
      }),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Giờ không hợp lệ" }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Giờ không hợp lệ" }),
    note: z.string().max(500).optional(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "Giờ kết thúc phải sau giờ bắt đầu",
    path: ["endTime"],
  });

export const cancelBookingSchema = z.object({ reason: z.string().max(500) });
