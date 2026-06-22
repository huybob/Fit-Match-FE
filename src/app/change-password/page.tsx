"use client";

import { useTranslation } from "react-i18next";
import { ChangePasswordForm } from "@/modules/forms/auth-forms";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <AuthGuard>
        <AuthPageShell
          title={t("auth.changePasswordTitle")}
          description={t("auth.changePasswordDescription")}
        >
          <ChangePasswordForm />
        </AuthPageShell>
      </AuthGuard>
    </SiteLayout>
  );
}
