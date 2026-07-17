import { TrainersDirectoryPage } from "@/modules/trainer/components/trainer-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
export const metadata = {
  title: "Huấn luyện viên | FitMatch",
  description: "Danh sách PT được phòng tập xác thực — lọc theo chuyên môn, khu vực và đặt lịch tập 1-1.",
};


export default function TrainersRoute() {
  return <TrainersDirectoryPage />;
}
