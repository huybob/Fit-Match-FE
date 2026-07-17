"use client";

import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { GymSidebar } from "@/modules/gym/components/gym-sidebar";
import { ResponsiveSidebar } from "@/shared/components/common/responsive-sidebar";

export function GymLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {/* F-30: mobile dùng drawer, desktop giữ sidebar cố định */}
        <ResponsiveSidebar>
          <GymSidebar />
        </ResponsiveSidebar>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
