import { notFound } from "next/navigation";
import { GymPublicDetailPage } from "@/modules/gym/components/gym-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
export const metadata = {
  title: "Chi tiết phòng tập | FitMatch",
  description: "Thông tin phòng gym: dịch vụ, gói tập, chi nhánh, giờ mở cửa và huấn luyện viên.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // F-35: id rác (chữ, số âm) -> 404 chuẩn thay vì query với NaN.
  const gymId = Number(id);
  if (!Number.isInteger(gymId) || gymId <= 0) notFound();
  return <GymPublicDetailPage gymId={gymId} />;
}
