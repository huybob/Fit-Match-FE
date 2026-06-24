"use client";

import { useTranslation } from "react-i18next";
import { ChangePasswordForm } from "@/modules/forms/auth-forms";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <AuthGuard>
        <main className="mx-auto max-w-md px-4 py-14 sm:px-6">
          <h1 className="text-2xl font-black">{t("auth.changePasswordTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.changePasswordDescription")}</p>
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <ChangePasswordForm />
          </div>
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
