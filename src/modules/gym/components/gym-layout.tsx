"use client";

import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { GymSidebar } from "@/modules/gym/components/gym-sidebar";
import { ResponsiveSidebar } from "@/shared/components/common/responsive-sidebar";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";

export function GymLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {/* F-30: mobile dùng drawer, desktop giữ sidebar cố định */}
        <ResponsiveSidebar>
          <GymSidebar />
        </ResponsiveSidebar>
        {/* Header ở LAYOUT: trước đây mỗi page tự gắn nên 8/16 trang gym không có
            thanh này — chuông thông báo, đổi ngôn ngữ, đổi theme và menu tài khoản
            biến mất tuỳ trang. */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <WorkspaceHeader />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
