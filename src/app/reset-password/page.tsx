"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";
import { ResetPasswordForm } from "@/modules/forms/auth-forms";
import { useTranslations } from "next-intl";

function ResetPasswordContent() {
  const t = useTranslations();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  if (!token) {
    return (
      <div className="space-y-4 text-center py-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("auth.invalidLinkTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.invalidLinkBody")}
        </p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          {t("auth.requestNewLinkAction")}
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
