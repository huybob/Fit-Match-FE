import { redirect } from "next/navigation";

// P0-5 (audit 2026-07-17): chi tiết gói mock — xem ghi chú tại src/app/packages/page.tsx.
export default function PackageDetailRoute() {
  redirect("/gyms");
}
