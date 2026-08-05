import type { ComponentProps } from "react";
import type { Badge } from "@/shared/components/ui/badge";
import type { Booking, BookingStatus } from "@/services/booking.service";

/**
 * Màu badge theo trạng thái booking.
 *
 * Tách khỏi booking-pages.tsx để bảng thời gian biểu dùng CHUNG một bảng màu —
 * import ngược từ booking-pages sẽ tạo vòng lặp (trang đó lại import bảng).
 */
export function statusVariant(status?: BookingStatus): ComponentProps<typeof Badge>["variant"] {
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED" || status === "CANCELLED" || status === "NO_SHOW") return "destructive";
  if (status === "CONFIRMED") return "info";
  if (status === "PENDING_PAYMENT" || status === "PENDING_GYM") return "warning";
  return "default";
}

/** `fallback` truyền từ component vì helper thường không gọi được hook. */
export function itemName(booking: Booking, fallback: string) {
  return booking.serviceName ?? booking.packageName ?? fallback;
}
