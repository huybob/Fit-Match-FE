import { redirect } from "next/navigation";

// Phase 4 (audit D-5/C-16): trang success cũ là mock tĩnh không xác minh gì —
// trạng thái thanh toán giờ tự cập nhật trong dialog QR (poll webhook Casso).
export default function CheckoutSuccessRedirect() {
  redirect("/profile/bookings");
}
