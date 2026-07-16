import { redirect } from "next/navigation";

// Check-in giờ thực hiện trên chi tiết booking (UC-046) — chuyển về màn booking của gym.
export default function CheckInRedirect() {
  redirect("/gym/bookings");
}
