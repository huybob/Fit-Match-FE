import { TrainerDetailPage } from "@/modules/ecommerce/ecommerce-pages";

export default async function TrainerDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrainerDetailPage id={id} />;
}
