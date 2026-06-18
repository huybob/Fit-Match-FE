"use client";

import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.util";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: string; label: ReactNode }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "h-9 rounded px-3 text-sm font-bold text-zinc-600 transition dark:text-zinc-300",
            active === tab.value && "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
