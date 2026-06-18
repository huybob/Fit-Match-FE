"use client";

import { ReactNode } from "react";

export function Sheet({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[80] w-full max-w-sm border-l border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}
