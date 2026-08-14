"use client";

import { AdminTicketRefundsPage } from "@/modules/ticket/components/admin-ticket-refunds";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function AdminRefundsRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"]}>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <AdminTicketRefundsPage />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
