"use client";

import { GymCalendarPage } from "@/modules/ticket/components/gym-calendar";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function GymCalendarRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <GymCalendarPage />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
