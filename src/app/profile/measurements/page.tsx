"use client";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { MeasurementsPage } from "@/modules/measurement/components/measurement-pages";

export default function CustomerMeasurementsRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_CUSTOMER"]}>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <MeasurementsPage scope="customer" />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
