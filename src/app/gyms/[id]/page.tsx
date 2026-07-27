import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { GymPublicDetailPage } from "@/modules/gym/components/gym-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
/**
 * metadata phải dịch phía SERVER (getTranslations) — hook không dùng được ở đây.
 */
export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("meta.gymDetail.title"),
    description: t("meta.gymDetail.description"),
  };
}

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
