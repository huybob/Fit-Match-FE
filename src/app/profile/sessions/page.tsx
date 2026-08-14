import { redirect } from "next/navigation";

// Đường dẫn cũ của mô hình booking. Trước đây redirect sang /profile/bookings —
// route đó đã bị xoá nên chuyển hướng rơi thẳng vào 404. Buổi tập giờ nằm trên
// lịch đặt.
export default function ProfileLegacySessionsRedirect() {
  redirect("/schedule");
}
