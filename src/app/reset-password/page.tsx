"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";
import { ResetPasswordForm } from "@/modules/forms/auth-forms";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  if (!token) {
    return (
      <div className="space-y-4 text-center py-4">
        <h1 className="text-2xl font-semibold text-foreground">Link không hợp lệ</h1>
        <p className="text-sm text-muted-foreground">
          Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell variant="login">
      <Suspense fallback={<div className="h-40" />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthPageShell>
  );
}
