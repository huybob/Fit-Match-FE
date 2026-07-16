import { redirect } from "next/navigation";

// Màn thành viên cũ dùng mock — chuyển về quản lý booking thật của gym.
export default function MembersRedirect() {
  redirect("/gym/bookings");
}
