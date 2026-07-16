"use client";

import { ReactNode } from "react";
import { AuthBootstrap } from "@/modules/auth/auth-bootstrap";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function AppClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ToastProvider>
    </ThemeProvider>
  );
}
