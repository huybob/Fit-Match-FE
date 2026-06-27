"use client";

import { ReactNode } from "react";
import { AuthBootstrap } from "@/modules/auth/auth-bootstrap";
import { ToastProvider } from "./toast-provider";

export function AppClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthBootstrap>{children}</AuthBootstrap>
    </ToastProvider>
  );
}
