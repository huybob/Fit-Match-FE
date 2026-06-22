import { GymPublicDetailPage } from "@/modules/gym/components/gym-public-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GymPublicDetailPage gymId={Number(id)} />;
}
