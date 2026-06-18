"use client";

import { ReactNode } from "react";
import { Button } from "./button";

export function Dialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-zinc-950/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black">{title}</h2>
          <Button
            type="button"
            onClick={onClose}
            className="size-9 bg-white p-0 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:ring-zinc-800"
          >
            x
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
