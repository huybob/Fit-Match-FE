"use client";

import { ReactNode } from "react";
import { AuthBootstrap } from "@/modules/auth/auth-bootstrap";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function AppClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* Radix Tooltip bắt buộc có Provider ở trên cây — mount 1 lần ở đây để
          mọi Tooltip trong app hoạt động (trước đây thiếu nên tooltip không hiện). */}
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        <ToastProvider>
          <AuthBootstrap>{children}</AuthBootstrap>
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
