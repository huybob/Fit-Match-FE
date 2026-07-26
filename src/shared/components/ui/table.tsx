"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn.util";

/**
 * Khối bọc bảng: bo góc, viền, và cho cuộn ngang bên trong chính nó
 * để trang không bao giờ bị cuộn ngang trên mobile.
 */
const TableContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="table-container"
    className={cn(
      "relative w-full overflow-x-auto overflow-y-visible rounded-2xl border border-border bg-card shadow-sm",
      className,
    )}
    {...props}
  />
));
TableContainer.displayName = "TableContainer";

const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    data-slot="table"
    className={cn("w-full caption-bottom border-collapse text-left text-sm", className)}
    {...props}
  />
));
Table.displayName = "Table";

/** Header dính (sticky) khi cuộn dọc trong vùng bảng. */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    data-slot="table-header"
    className={cn("sticky top-0 z-10 bg-muted/80 backdrop-blur-sm", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    data-slot="table-body"
    className={cn("divide-y divide-border", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t border-border bg-muted/50 font-bold", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Bật con trỏ pointer + hiệu ứng hover cho hàng bấm được. */
  clickable?: boolean;
  selected?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable, selected, ...props }, ref) => (
    <tr
      ref={ref}
      data-slot="table-row"
      data-state={selected ? "selected" : undefined}
      // Hàng bấm được phải focus được bằng bàn phím, không chỉ bằng chuột.
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.currentTarget.click();
              }
              props.onKeyDown?.(event);
            }
          : props.onKeyDown
      }
      className={cn(
        "transition-colors data-[state=selected]:bg-primary/10",
        clickable &&
          "cursor-pointer hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        !clickable && "hover:bg-muted/40",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    data-slot="table-head"
    className={cn(
      "whitespace-nowrap px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    data-slot="table-cell"
    className={cn("px-5 py-4 align-middle font-medium text-foreground", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export type SortDirection = "asc" | "desc" | null;

/**
 * Nút sắp xếp trong header. Nhấn để xoay vòng asc → desc → bỏ sắp xếp,
 * kèm aria-sort để screen reader đọc đúng trạng thái.
 */
export function TableSortButton({
  label,
  direction,
  onSort,
  className,
}: {
  label: React.ReactNode;
  direction: SortDirection;
  onSort: (next: SortDirection) => void;
  className?: string;
}) {
  const t = useTranslations();
  const next: SortDirection = direction === null ? "asc" : direction === "asc" ? "desc" : null;
  const hint =
    next === "asc"
      ? t("common.table.sortAscending")
      : next === "desc"
        ? t("common.table.sortDescending")
        : t("common.table.clearSort");

  return (
    <button
      type="button"
      onClick={() => onSort(next)}
      title={hint}
      aria-label={hint}
      className={cn(
        "-mx-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        direction && "text-foreground",
        className,
      )}
    >
      {label}
      {direction === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : direction === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" />
      )}
    </button>
  );
}

/** Bọc text dài để cắt bằng ellipsis nhưng vẫn xem được đầy đủ khi hover. */
export function TableEllipsis({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title ?? (typeof children === "string" ? children : undefined)}
      className={cn("block max-w-[22rem] truncate", className)}
    >
      {children}
    </span>
  );
}

export {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
