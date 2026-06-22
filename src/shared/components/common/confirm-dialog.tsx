"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";

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
  const { t } = useTranslation();

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-red-600 hover:bg-red-500"
      >
        {label}
      </Button>
      <Dialog open={open} title={title} onClose={() => setOpen(false)}>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            className="bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:ring-zinc-800"
            onClick={() => setOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-500"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
