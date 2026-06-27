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
      <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/65 shadow-[0_24px_80px_rgba(16,19,15,0.1)] backdrop-blur-xl lg:grid lg:min-h-[680px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#121610] via-[#10130f] to-[#182011] text-white lg:border-b-0 lg:border-r">
          <div className="absolute -left-16 top-12 size-48 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="relative border-b border-white/10 px-5 py-5 lg:px-6 lg:py-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime-300 text-zinc-950 shadow-lg shadow-lime-500/15">
                <Dumbbell className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
                  FitMatch OS
                </p>
                <p className="mt-1 truncate text-base font-black">{title}</p>
              </div>
            </div>
            <p className="mt-4 hidden text-sm leading-6 text-zinc-400 lg:block">
              {description}
            </p>
          </div>

          <nav className="relative flex gap-2 overflow-x-auto p-3 lg:grid lg:gap-1.5 lg:overflow-visible lg:p-4">
            {links.map(({ href, icon: Icon, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 lg:min-w-0",
                    active
                      ? "bg-lime-300 text-zinc-950 shadow-lg shadow-lime-950/20"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4.5 shrink-0 transition-transform group-hover:scale-110",
                      active ? "text-zinc-950" : "text-zinc-500",
                    )}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 bg-gradient-to-br from-white/70 to-zinc-50/50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
