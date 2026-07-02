"use client";

import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { GymSidebar } from "@/modules/gym/components/gym-sidebar";

export function GymLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
      <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
        <GymSidebar />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
