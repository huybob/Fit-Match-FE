import { redirect } from "next/navigation";

// Checkout cũ (mock) đã bỏ — thanh toán VietQR thực hiện trong luồng booking (UC-035/052).
export default function CheckoutRedirect() {
  redirect("/profile/bookings");
}
