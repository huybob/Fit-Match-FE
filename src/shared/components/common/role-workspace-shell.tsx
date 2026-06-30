"use client";

import type { LucideIcon } from "lucide-react";
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.util";

type WorkspaceLink = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export function RoleWorkspaceShell({
  title,
  description,
  links,
  pathname,
  children,
}: {
  title: string;
  description: string;
  links: WorkspaceLink[];
  pathname: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid lg:min-h-[680px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-gray-100 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-white">
                <Dumbbell className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  FitMatch
                </p>
                <p className="truncate text-sm font-bold text-[#0f172a]">{title}</p>
              </div>
            </div>
            <p className="mt-3 hidden text-xs leading-5 text-gray-400 lg:block">
              {description}
            </p>
          </div>

          <nav className="flex gap-1 overflow-x-auto p-3 lg:grid lg:gap-0.5 lg:overflow-visible lg:p-3">
            {links.map(({ href, icon: Icon, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex min-w-max items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:min-w-0",
                    active
                      ? "bg-[#2563eb] text-white"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#0f172a]",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-white" : "text-gray-400",
                    )}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 bg-[#f8f9fc] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
