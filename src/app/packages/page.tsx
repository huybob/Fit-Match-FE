import { getTranslations } from "next-intl/server";
import { PackagesPublicPage } from "@/modules/package/components/package-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
/**
 * metadata phải dịch phía SERVER (getTranslations) — hook không dùng được ở đây.
 */
export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("meta.packages.title"),
    description: t("meta.packages.description"),
  };
}

export default function Page() {
  return <PackagesPublicPage />;
}
