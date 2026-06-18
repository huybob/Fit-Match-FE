"use client";

import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.util";

export function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error?: { message?: string };
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-sm font-semibold text-red-500">{error.message}</p>}
    </label>
  );
}

export const inputClassName = cn(
  "h-11 w-full rounded-md border border-[#dedfce] bg-white px-3 text-sm font-semibold text-[#10130f] outline-none transition placeholder:text-[#858a78] focus:border-[#a3ff12] focus:ring-2 focus:ring-[#a3ff12]/30",
  "dark:border-white/10 dark:bg-[#121610] dark:text-white",
);

export const selectClassName = inputClassName;
