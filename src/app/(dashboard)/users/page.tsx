"use client";

import { useTranslation } from "react-i18next";
import { UserTable } from "@/modules/user";

export default function UsersPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#dedfce]/80 bg-white/70 px-6 py-7 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] sm:px-8">
        <div className="absolute -right-12 -top-16 size-40 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="relative">
          <div className="mb-4 h-1 w-12 rounded-full bg-[#ff6b22]" />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {t("admin.users")}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-500">
            {t("admin.usersDescription")}
          </p>
        </div>
      </div>
      <UserTable />
    </main>
  );
}
