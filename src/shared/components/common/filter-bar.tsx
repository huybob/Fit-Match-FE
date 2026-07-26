"use client";

import * as React from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";

/**
 * Thanh công cụ đầu trang: nhóm nội dung bên trái, nhóm hành động bên phải,
 * tự xuống dòng trên mobile để không bao giờ mất nút.
 */
export function Toolbar({
  children,
  actions,
  className,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * Khối bộ lọc dùng chung cho các trang danh sách.
 *
 * Hiện nút "Đặt lại bộ lọc" chỉ khi đang có filter (`active`), kèm số lượng
 * filter đang áp dụng để người dùng biết vì sao danh sách bị thu hẹp.
 */
export function FilterBar({
  children,
  active = 0,
  onReset,
  title,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  /** Số bộ lọc đang được áp dụng. */
  active?: number;
  onReset?: () => void;
  title?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const t = useTranslations();

  return (
    <section
      className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm", className)}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div
          className={cn(
            "grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            contentClassName,
          )}
        >
          {children}
        </div>

        {onReset ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={active === 0}
            className="cursor-pointer shrink-0 gap-1.5 self-start lg:self-end"
          >
            <RotateCcw className="size-3.5" />
            {t("common.actions.resetFilter")}
            {active > 0 ? (
              <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                {active}
              </span>
            ) : null}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** Nhãn nhỏ đặt trên mỗi control trong FilterBar. */
export function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-black uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export { SlidersHorizontal as FilterIcon };
