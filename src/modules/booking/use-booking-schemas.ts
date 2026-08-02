"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Hôm nay theo giờ MÁY, dạng "yyyy-MM-dd".
 *
 * toISOString() trả về UTC nên ở VN (UTC+7) khoảng 00:00–07:00 nó cho ra ngày hôm
 * qua — ràng buộc "không được đặt lịch ở quá khứ" khi đó nới lỏng một ngày.
 */
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * UC-031/032/049: đặt mới (chọn gym + dịch vụ/gói) hoặc dùng buổi từ gói đã mua.
 * mode="new" -> cần gymId + itemId; mode="package" -> cần customerPackageId.
 *
 * Là hook vì message phải dịch được. Kiểu dữ liệu và mọi ràng buộc giữ NGUYÊN
 * như schema tĩnh cũ — payload gửi BE không đổi.
 */
export function useBookingSchemas() {
  const t = useTranslations();

  return useMemo(() => {
    const createBooking = z
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
          .min(1, { message: t("booking.validation.pickDate") })
          .refine((value) => value >= todayLocal(), {
            message: t("booking.validation.dateInvalid"),
          }),
        startTime: z.string().regex(TIME_RE, { message: t("booking.validation.invalidTime") }),
        endTime: z.string().regex(TIME_RE, { message: t("booking.validation.invalidTime") }),
        note: z.string().max(500).optional(),
      })
      .refine((v) => v.endTime > v.startTime, {
        message: t("common.validation.timeRange"),
        path: ["endTime"],
      })
      .refine((v) => v.mode !== "new" || ((v.gymId ?? 0) > 0 && (v.itemId ?? 0) > 0), {
        message: t("booking.validation.pickGymAndItem"),
        path: ["itemId"],
      })
      .refine((v) => v.mode !== "package" || (v.customerPackageId ?? 0) > 0, {
        message: t("booking.validation.pickPurchasedPackage"),
        path: ["customerPackageId"],
      });

    return { createBooking };
  }, [t]);
}
