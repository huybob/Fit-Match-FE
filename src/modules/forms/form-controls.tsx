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
    <label className="block space-y-2">
      <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <div>{children}</div>
      {error && (
        <p className="mt-1 text-sm font-semibold text-red-500">
          {error.message}
        </p>
      )}
    </label>
  );
}

export const inputClassName = cn(
  "h-11 w-full rounded-xl border border-[#d6d8c6] bg-white/90 px-3.5 text-sm font-semibold text-[#10130f] shadow-sm outline-none transition placeholder:font-medium placeholder:text-[#858a78] hover:border-[#b9bda8] focus:border-[#88d900] focus:ring-4 focus:ring-[#a3ff12]/20",
  "dark:border-white/10 dark:bg-[#121610] dark:text-white",
);

export const selectClassName = inputClassName;
