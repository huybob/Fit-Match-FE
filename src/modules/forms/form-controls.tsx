"use client";

import { ReactNode } from "react";
import { FieldError } from "react-hook-form";
import { cn } from "@/shared/utils/cn.util";

export function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error?: FieldError;
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
  "h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
  "dark:border-zinc-800 dark:bg-zinc-900 dark:text-white",
);

export const selectClassName = inputClassName;
