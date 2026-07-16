import { redirect } from "next/navigation";

// Màn này gọi API chưa có ở BE (mô hình PT độc lập cũ) — chuyển về lịch đặt thật.
export default function ProfileLegacyRedirect() {
  redirect("/profile/bookings");
}
