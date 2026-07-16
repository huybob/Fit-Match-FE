import { redirect } from "next/navigation";

// Màn lịch cũ dùng mock — chuyển về danh sách booking thật của gym.
export default function ScheduleRedirect() {
  redirect("/gym/bookings");
}
