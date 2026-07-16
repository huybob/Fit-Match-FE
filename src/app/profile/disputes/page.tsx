"use client";

import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { MyDisputesPage } from "@/modules/dispute/components/dispute-pages";

export default function ProfileDisputesRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_CUSTOMER"]}>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <MyDisputesPage />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
