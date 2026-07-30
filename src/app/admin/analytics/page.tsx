import { redirect } from "next/navigation";

// Màn "Phân tích" đã gộp vào "Tổng quan" (/admin) — giữ route này để link/bookmark
// cũ không 404.
export default function AdminAnalyticsRoute() {
  redirect("/admin");
}
