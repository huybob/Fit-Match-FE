import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_ADMIN"]}>{children}</AuthGuard>
    </SiteLayout>
  );
}
