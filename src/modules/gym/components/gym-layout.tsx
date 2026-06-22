"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { cn } from "@/shared/utils/cn.util";

export function GymLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { t } = useTranslation();
  const links = [
    [t("gymModule.myGyms"), "/gym/gyms"],
    [t("gymModule.partnerships"), "/gym/partnerships"],
  ] as const;
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
          <aside className="h-fit rounded-2xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:sticky lg:top-24">
            <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-500">
              {t("gymModule.workspace")}
            </p>
            <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
                    path.startsWith(href)
                      ? "bg-lime-300 text-zinc-950"
                      : "hover:translate-x-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  )}
                >
                  {label}
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
