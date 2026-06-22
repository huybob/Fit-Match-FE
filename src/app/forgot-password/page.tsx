"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SiteLayout } from "@/modules/layout/site-layout";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-black">{t("auth.forgotTitle")}</h1>
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950 shadow-sm dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <Info className="size-6" />
          <p className="mt-3 font-semibold">{t("auth.recoveryUnavailable")}</p>
          <Link
            className="mt-5 inline-block text-sm font-black underline"
            href="/login"
          >
            {t("auth.returnToLogin")}
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}
