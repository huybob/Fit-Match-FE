"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { cn } from "@/shared/utils/cn.util";

export function GymLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const links = [
    ["My gyms", "/gym/gyms"],
    ["PT partnerships", "/gym/partnerships"],
  ] as const;
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_GYM_OPERATOR"]}>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-500">
              Gym workspace
            </p>
            <nav className="grid gap-1">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-bold",
                    path.startsWith(href)
                      ? "bg-lime-300 text-zinc-950"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
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
