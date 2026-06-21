"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { getHomeRouteForRole, UserRole } from "./auth-routing";
import { useAuthStore } from "./auth.store";

export function AuthGuard({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const router = useRouter();
  const { status, user } = useAuthStore();
  const forbidden = status === "authenticated" && roles && (!user?.role || !roles.includes(user.role));

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (forbidden) router.replace(getHomeRouteForRole(user?.role));
  }, [forbidden, router, status, user?.role]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-lime-500" aria-label="Loading session" />
      </div>
    );
  }

  if (status !== "authenticated" || forbidden) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <ShieldAlert className="size-8 text-orange-500" aria-label="Access denied" />
      </div>
    );
  }

  return children;
}
