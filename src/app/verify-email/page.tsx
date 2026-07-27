"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { authService } from "@/services/auth.service";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";
import { useTranslations } from "next-intl";

function VerifyEmailContent() {
  const t = useTranslations();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "no-token") {
    return (
      <div className="space-y-4 text-center py-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("auth.verifyInvalidTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth.verifyNoToken")}</p>
        <Link href="/resend-verification" className="text-sm text-primary hover:underline">
          {t("auth.resendVerify")}
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t("auth.verifying")}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success-muted">
            <CheckCircle className="size-8 text-success" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t("auth.verifiedTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.verifiedBody")}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
        >
          {t("auth.loginNow")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-4">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="size-8 text-destructive" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t("auth.verifyFailedTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.verifyFailedBody")}
        </p>
      </div>
      <Link href="/resend-verification" className="text-sm text-primary hover:underline">
        {t("auth.resendVerify")}
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthPageShell variant="login">
      <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthPageShell>
  );
}
