import { TrainerPublicDetailPage } from "@/modules/trainer/components/trainer-public-pages";

export default async function TrainerDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrainerPublicDetailPage userId={Number(id)} />;
}
