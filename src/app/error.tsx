"use client";

// F-27 (audit 2026-07-17): trước đây không có error boundary nào —
// crash render bất kỳ hiện màn lỗi mặc định tiếng Anh của Next.

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("errorPage.title")}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {t("errorPage.body")}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">{t("errorPage.digest", { digest: error.digest })}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <RotateCcw className="size-4" />{t("common.actions.retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("errorPage.home")}</Link>
        </Button>
      </div>
    </div>
  );
}
