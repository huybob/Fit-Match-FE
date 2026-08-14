"use client";

import { Suspense } from "react";
import { TicketSchedulePage } from "@/modules/ticket/components/ticket-schedule";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";

export default function ScheduleRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_CUSTOMER"]}>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<LoadingSkeleton />}>
            <TicketSchedulePage />
          </Suspense>
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
