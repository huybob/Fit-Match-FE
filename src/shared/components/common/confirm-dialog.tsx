"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { useTranslations } from "next-intl";

export function ConfirmDialog({
  label,
  title,
  description,
  destructive = true,
  onConfirm,
}: {
  label: string;
  title: string;
  description?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >{t("common.actions.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
