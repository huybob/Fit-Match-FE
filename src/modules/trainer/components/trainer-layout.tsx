"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { cn } from "@/shared/utils/cn.util";

const links = [
  ["profile", "/trainer/profile"],
  ["services", "/trainer/services"],
  ["availability", "/trainer/availability"],
  ["certificates", "/trainer/certificates"],
  ["partnerships", "/trainer/partnerships"],
] as const;

export function TrainerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_PT"]}>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-2xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
            <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-500">
              {t("trainerModule.workspace")}
            </p>
            <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {links.map(([key, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
                    pathname === href
                      ? "bg-lime-300 text-zinc-950 shadow-sm"
                      : "hover:translate-x-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  )}
                >
                  {t(`trainerModule.${key}`)}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </AuthGuard>
    </SiteLayout>
  );
}
