"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ReportPage } from "@/modules/report/report-page";
import { useTranslations } from "next-intl";

// P0-4 (audit 2026-07-17): dashboard cũ render 100% số liệu mock hardcode -> thay
// bằng báo cáo vận hành thật.
// Trước đây trang này redirect sang /admin/analytics, nên sidebar có 2 mục ("Tổng
// quan" + "Phân tích") cùng dẫn tới một màn — bấm "Tổng quan" lại sáng đèn ở
// "Phân tích". Nay /admin RENDER thẳng báo cáo, chỉ còn một mục duy nhất.
// MODERATOR không có quyền xem báo cáo (BE trả 403) nên vẫn đưa về disputes.
export default function AdminIndexRoute() {
  const t = useTranslations();
  const router = useRouter();
  const { status, user } = useAuthStore();
  const isModerator = user?.role === "ROLE_MODERATOR";

  useEffect(() => {
    if (status !== "authenticated") return;
    if (isModerator) router.replace("/admin/disputes");
  }, [isModerator, router, status]);

  if (status !== "authenticated" || isModerator) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label={t("admin.redirecting")} />
      </div>
    );
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <ReportPage scope="admin" />
    </main>
  );
}
