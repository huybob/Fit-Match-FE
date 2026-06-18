"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";

export function ConfirmDialog({
  label,
  title,
  onConfirm,
}: {
  label: string;
  title: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-red-600 hover:bg-red-500"
      >
        {label}
      </Button>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-zinc-950/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-950">
            <h3 className="text-lg font-bold">{title}</h3>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                className="bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:ring-zinc-800"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-500"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
