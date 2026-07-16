import { GymsPublicPage } from "@/modules/gym/components/gym-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
export const metadata = {
  title: "Phòng tập | FitMatch",
  description: "Tìm phòng gym đã xác minh theo khu vực — xem dịch vụ, gói tập, giờ mở cửa và đặt lịch trực tuyến.",
};

export default function Page() {
  return <GymsPublicPage />;
}
