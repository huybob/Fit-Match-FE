import { redirect } from "next/navigation";

// P0-5 (audit 2026-07-17): trang gói tập cũ chạy 100% mock (gymPackages) với nút
// "Thêm vào giỏ" giả. Gói tập thật hiển thị theo từng phòng tập và được chọn trong
// luồng đặt lịch; marketplace search gói toàn sàn chưa có endpoint BE (Phase 5).
export default function PackagesRoute() {
  redirect("/gyms");
}
