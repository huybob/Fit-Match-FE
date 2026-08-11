import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PackageDetailPage } from "@/modules/package/components/package-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
/**
 * metadata phải dịch phía SERVER (getTranslations) — hook không dùng được ở đây.
 */
export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("meta.packageDetail.title"),
    description: t("meta.packageDetail.description"),
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gym?: string }>;
}) {
  const { id } = await params;
  // F-35: id rác (chữ, số âm) -> 404 chuẩn thay vì query với NaN.
  const packageId = Number(id);
  if (!Number.isInteger(packageId) || packageId <= 0) notFound();

  // BE chưa có `GET /marketplace/packages/{id}`; gói chỉ tra được qua catalog của
  // gym nên `?gym=` là bắt buộc. Thiếu/rác thì để component báo rõ, không 404 —
  // id gói vẫn hợp lệ, chỉ là link mất ngữ cảnh.
  const { gym } = await searchParams;
  const gymId = Number(gym ?? "");
  const validGymId = Number.isInteger(gymId) && gymId > 0 ? gymId : undefined;

  return <PackageDetailPage packageId={packageId} gymId={validGymId} />;
}
