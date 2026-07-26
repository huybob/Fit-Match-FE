import { getTranslations } from "next-intl/server";
import { GymsPublicPage } from "@/modules/gym/components/gym-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
/**
 * metadata phải dịch phía SERVER (getTranslations) — hook không dùng được ở đây.
 */
export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("meta.gyms.title"),
    description: t("meta.gyms.description"),
  };
}

export default function Page() {
  return <GymsPublicPage />;
}
