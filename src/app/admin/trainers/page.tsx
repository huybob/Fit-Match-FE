import { redirect } from "next/navigation";

// P0-6 (audit 2026-07-17): trang cũ render mock + CRUD giả. Quản lý PT (đình chỉ/gỡ
// đình chỉ, đổi role) đã có thật trong trang Users (lọc role PT).
export default function AdminTrainersRoute() {
  redirect("/admin/users");
}
