"use client";

import * as React from "react";
import { type FieldError } from "react-hook-form";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn.util";

/**
 * Nhãn + ô nhập + thông báo lỗi cho một trường form.
 *
 * Nhãn được NỐI THẬT với ô nhập: FieldShell tự sinh id, truyền xuống con qua
 * cloneElement (nếu con chưa có id), rồi trỏ `htmlFor` vào đó. Trước đây `<Label>`
 * chỉ đứng cạnh input mà không có `htmlFor` — nhìn thì đúng, nhưng trình đọc màn
 * hình đọc ô nhập là "edit text" không tên, và bấm vào nhãn không focus vào ô.
 *
 * Lỗi nối bằng `aria-describedby` để trình đọc màn hình đọc luôn lý do khi focus
 * vào ô sai.
 */
export function FieldShell({
  label,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  error?: FieldError | { message?: string };
  children: React.ReactNode;
  className?: string;
  /** Ghi đè id của control khi con không nhận prop `id`. */
  htmlFor?: string;
}) {
  const autoId = React.useId();
  const child = React.isValidElement(children)
    ? (children as React.ReactElement<Record<string, unknown>>)
    : null;
  const childId = child?.props?.id as string | undefined;
  const controlId = htmlFor ?? childId ?? (child ? autoId : undefined);
  const errorId = error?.message && controlId ? `${controlId}-error` : undefined;

  const control =
    child && !childId && !htmlFor
      ? React.cloneElement(child, {
          id: controlId,
          "aria-describedby":
            [child.props["aria-describedby"] as string | undefined, errorId].filter(Boolean).join(" ") ||
            undefined,
        })
      : children;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={controlId}>{label}</Label>
      {control}
      {error?.message && (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs font-semibold text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export const inputClassName = cn(
  "flex h-11 w-full rounded-xl border border-input bg-card/90 px-3.5 text-sm font-semibold text-foreground shadow-sm outline-none transition",
  "placeholder:font-medium placeholder:text-muted-foreground",
  "hover:border-ring/50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const selectClassName = cn(inputClassName, "cursor-pointer");
