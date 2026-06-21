"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "./auth.store";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    void initialize();

    window.addEventListener("fitmatch:auth-expired", clearSession);
    return () => window.removeEventListener("fitmatch:auth-expired", clearSession);
  }, [clearSession, initialize]);

  return children;
}
