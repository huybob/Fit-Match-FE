"use client";

import { MyTicketsPage } from "@/modules/ticket/components/my-tickets";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function MyTicketsRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_CUSTOMER"]}>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <MyTicketsPage />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
