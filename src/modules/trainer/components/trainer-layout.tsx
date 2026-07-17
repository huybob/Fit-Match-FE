"use client";

import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { TrainerSidebar } from "@/modules/trainer/components/trainer-sidebar";
import { ResponsiveSidebar } from "@/shared/components/common/responsive-sidebar";

export function TrainerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["ROLE_PT"]}>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {/* F-30: mobile dùng drawer, desktop giữ sidebar cố định */}
        <ResponsiveSidebar>
          <TrainerSidebar />
        </ResponsiveSidebar>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
