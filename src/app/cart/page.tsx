import { redirect } from "next/navigation";

// Mô hình giỏ hàng cũ đã bỏ — đặt lịch trực tiếp qua booking (UC-031..035).
export default function CartRedirect() {
  redirect("/profile/bookings");
}
