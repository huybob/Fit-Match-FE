"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SiteLayout } from "@/modules/layout/site-layout";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <AuthPageShell
        title={t("auth.forgotTitle")}
        description={t("auth.forgotDescription")}
      >
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <Info className="size-6" />
          <p className="mt-3 font-semibold">{t("auth.recoveryUnavailable")}</p>
          <Link
            className="mt-5 inline-block text-sm font-black underline"
            href="/login"
          >
            {t("auth.returnToLogin")}
          </Link>
        </div>
      </AuthPageShell>
    </SiteLayout>
  );
}
