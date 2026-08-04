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

interface ConfirmContent {
  title: string;
  description?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/** Thân hộp thoại dùng chung cho cả hai biến thể — một giao diện xác nhận duy nhất. */
function ConfirmBody({
  title,
  description,
  destructive,
  onConfirm,
  onDone,
}: ConfirmContent & { onDone: () => void }) {
  const t = useTranslations();
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
        <AlertDialogAction
          className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
          onClick={() => {
            onConfirm();
            onDone();
          }}
        >
          {t("common.actions.confirm")}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

/** Xác nhận kèm sẵn nút bấm — dùng cho hành động xoá trong danh sách. */
export function ConfirmDialog({
  label,
  destructive = true,
  ...content
}: ConfirmContent & { label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={destructive ? "destructive" : "default"}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <ConfirmBody {...content} destructive={destructive} onDone={() => setOpen(false)} />
    </AlertDialog>
  );
}

/**
 * Xác nhận ĐIỀU KHIỂN TỪ NGOÀI — dùng khi việc có hỏi hay không phụ thuộc vào dữ
 * liệu người dùng vừa nhập (vd. chỉ hỏi khi email thật sự đổi), chứ không gắn với
 * một nút cố định.
 *
 * Có mặt để không màn hình nào phải quay lại window.confirm(): hộp thoại của trình
 * duyệt không theo theme, không dịch được nhãn nút, và nằm ngoài ngôn ngữ thiết kế
 * của hệ thống.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  destructive = false,
  ...content
}: ConfirmContent & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <ConfirmBody {...content} destructive={destructive} onDone={() => onOpenChange(false)} />
    </AlertDialog>
  );
}
