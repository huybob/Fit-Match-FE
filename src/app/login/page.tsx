"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LoginForm } from "@/modules/forms/auth-forms";
import { SiteLayout } from "@/modules/layout/site-layout";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <AuthPageShell
        title={t("auth.loginTitle")}
        description={t("auth.loginDescription")}
      >
        <LoginForm />
        <Link
          className="mt-4 block text-sm font-bold text-emerald-600"
          href="/forgot-password"
        >
          {t("auth.forgot")}
        </Link>
      </AuthPageShell>
    </SiteLayout>
  );
}
