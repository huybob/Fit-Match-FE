"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { getHomeRouteForRole, roleSatisfies, UserRole } from "./auth-routing";
import { useAuthStore } from "./auth.store";

export function AuthGuard({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthStore();
  const forbidden = status === "authenticated" && roles && !roles.some((r) => roleSatisfies(user?.role, r));

  useEffect(() => {
    // F-8: kèm returnUrl để login xong quay lại đúng trang định vào.
    if (status === "unauthenticated") {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
    if (forbidden) router.replace(getHomeRouteForRole(user?.role));
  }, [forbidden, pathname, router, status, user?.role]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading session" />
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
