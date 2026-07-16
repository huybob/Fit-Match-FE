import { redirect } from "next/navigation";

// Màn cũ dùng dữ liệu mock — thay bằng báo cáo thật của gym (UC-076).
export default function RevenueRedirect() {
  redirect("/gym/revenue");
}
