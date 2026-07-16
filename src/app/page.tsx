import { HomePage } from "@/modules/home/home-page";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
export const metadata = {
  title: "FitMatch — Đặt lịch PT & phòng tập",
  description: "Kết nối huấn luyện viên cá nhân được xác thực và phòng gym uy tín: tìm kiếm, đặt lịch, thanh toán VietQR và theo dõi tiến độ trong một nền tảng.",
};


export default function Home() {
  return <HomePage />;
}
