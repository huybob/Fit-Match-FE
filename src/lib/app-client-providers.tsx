"use client";

import { ReactNode } from "react";
import { AuthBootstrap } from "@/modules/auth/auth-bootstrap";
import { I18nProvider } from "./i18n-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function AppClientProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthBootstrap>{children}</AuthBootstrap>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
