import { notFound } from "next/navigation";
import { TrainerPublicDetailPage } from "@/modules/trainer/components/trainer-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
export const metadata = {
  title: "Hồ sơ huấn luyện viên | FitMatch",
  description: "Kinh nghiệm, chuyên môn, chứng chỉ và đánh giá của huấn luyện viên.",
};


export default async function TrainerDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // F-35: id rác (chữ, số âm) -> 404 chuẩn thay vì query với NaN.
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();
  return <TrainerPublicDetailPage userId={userId} />;
}
