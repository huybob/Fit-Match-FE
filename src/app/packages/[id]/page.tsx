import { PackageDetailPage } from "@/modules/ecommerce/ecommerce-pages";

export default async function PackageDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PackageDetailPage id={id} />;
}
