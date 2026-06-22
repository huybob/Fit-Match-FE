"use client";

import { useTranslation } from "react-i18next";
import { RegisterForm } from "@/modules/forms/auth-forms";
import { SiteLayout } from "@/modules/layout/site-layout";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <AuthPageShell
        title={t("auth.registerTitle")}
        description={t("auth.registerDescription")}
      >
        <RegisterForm />
      </AuthPageShell>
    </SiteLayout>
  );
}
