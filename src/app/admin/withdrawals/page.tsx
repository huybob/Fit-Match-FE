import { WithdrawalsPage } from "@/modules/withdrawal/components/withdrawal-pages";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function AdminWithdrawalsRoute() {
  return (
    <SiteLayout>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <WithdrawalsPage scope="admin" />
      </main>
    </SiteLayout>
  );
}
