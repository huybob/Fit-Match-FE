"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";

// P0-4 (audit 2026-07-17): dashboard cũ render 100% số liệu mock hardcode.
// Redirect theo role: ADMIN/FINANCE_ADMIN → analytics (dữ liệu thật);
// MODERATOR → disputes (analytics yêu cầu quyền ADMIN|FINANCE_ADMIN, vào sẽ 403).
export default function AdminIndexRoute() {
  const router = useRouter();
  const { status, user } = useAuthStore();

  useEffect(() => {
    if (status !== "authenticated") return;
    router.replace(user?.role === "ROLE_MODERATOR" ? "/admin/disputes" : "/admin/analytics");
  }, [router, status, user?.role]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Đang chuyển hướng" />
    </div>
  );
}
