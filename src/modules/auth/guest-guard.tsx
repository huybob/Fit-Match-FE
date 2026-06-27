"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { getHomeRouteForRole } from "./auth-routing";
import { useAuthStore } from "./auth.store";

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuthStore();

  useEffect(() => {
    if (status === "authenticated") router.replace(getHomeRouteForRole(user?.role));
  }, [router, status, user?.role]);

  if (status === "idle" || status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return children;
}
