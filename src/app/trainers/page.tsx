import { getTranslations } from "next-intl/server";
import { TrainersDirectoryPage } from "@/modules/trainer/components/trainer-public-pages";

// Phase 5 (SEO): metadata tĩnh cho trang public — root layout chỉ có title chung.
export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t("meta.trainers.title"),
    description: t("meta.trainers.description"),
  };
}


export default function TrainersRoute() {
  return <TrainersDirectoryPage />;
}
