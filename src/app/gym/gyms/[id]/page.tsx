import { GymManagePage } from "@/modules/gym/components/gym-workspace-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GymManagePage gymId={Number(id)} />;
}
