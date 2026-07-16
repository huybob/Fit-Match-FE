import { z } from "zod";

/**
 * UC-031/032/049: đặt mới (chọn gym + dịch vụ/gói) hoặc dùng buổi từ gói đã mua.
 * mode="new" -> cần gymId + itemId; mode="package" -> cần customerPackageId.
 */
export const createBookingSchema = z
  .object({
    mode: z.enum(["new", "package"]),
    gymId: z.number().int().nonnegative().optional(),
    itemType: z.enum(["service", "package"]),
    itemId: z.number().int().nonnegative().optional(),
    customerPackageId: z.number().int().positive().optional(),
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
  })
  .refine((v) => v.mode !== "new" || ((v.gymId ?? 0) > 0 && (v.itemId ?? 0) > 0), {
    message: "Vui lòng chọn phòng gym và dịch vụ/gói",
    path: ["itemId"],
  })
  .refine((v) => v.mode !== "package" || (v.customerPackageId ?? 0) > 0, {
    message: "Vui lòng chọn gói đã mua",
    path: ["customerPackageId"],
  });

export const cancelBookingSchema = z.object({ reason: z.string().max(500) });
