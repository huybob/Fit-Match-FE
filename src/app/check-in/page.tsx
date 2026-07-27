"use client";

// C-13 (audit 2026-07-17): trước đây redirect cứng về /gym/bookings — customer vào
// link này bị AuthGuard (ROLE_GYM_OPERATOR) đá ra. Redirect theo role thật.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useTranslations } from "next-intl";

export default function CheckInRedirect() {
  const t = useTranslations();
  const router = useRouter();
  const { status, user } = useAuthStore();

  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    const target =
      user?.role === "ROLE_GYM_OPERATOR" ? "/gym/bookings"
        : user?.role === "ROLE_PT" ? "/trainer/bookings"
          : "/profile/bookings";
    router.replace(target);
  }, [router, status, user?.role]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label={t("admin.redirecting")} />
    </div>
  );
}
