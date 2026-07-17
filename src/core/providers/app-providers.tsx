"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AppClientProviders } from "@/lib/app-client-providers";
import { queryClient } from "./query-client";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppClientProviders>{children}</AppClientProviders>
    </QueryClientProvider>
  );
}
