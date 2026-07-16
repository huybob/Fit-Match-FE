"use client";

// F-27 (audit 2026-07-17): trước đây không có error boundary nào —
// crash render bất kỳ hiện màn lỗi mặc định tiếng Anh của Next.

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="size-7 text-red-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Đã có lỗi xảy ra</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Rất tiếc, trang gặp sự cố khi hiển thị. Bạn có thể thử lại hoặc quay về trang chủ.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">Mã lỗi: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2 bg-primary text-white hover:bg-primary/90">
          <RotateCcw className="size-4" /> Thử lại
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
