"use client";

import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { TrainerSidebar } from "@/modules/trainer/components/trainer-sidebar";

export function TrainerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["ROLE_PT"]}>
      <div className="flex min-h-screen bg-[#f1f5f9]">
        <TrainerSidebar />
        <div className="flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
