import { PackagePublicDetailPage } from "@/modules/gym/components/package-public-pages";

export default async function PackageDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gym?: string }>;
}) {
  const { id } = await params;
  const { gym } = await searchParams;
  return (
    <PackagePublicDetailPage
      packageId={Number(id)}
      gymId={gym ? Number(gym) : undefined}
    />
  );
}
