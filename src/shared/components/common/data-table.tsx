"use client";

import * as React from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSortButton,
  type SortDirection,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/cn.util";

export interface DataTableColumn<T> {
  /** Khoá duy nhất của cột; cũng là khoá dùng khi sắp xếp. */
  key: string;
  header: React.ReactNode;
  /** Nội dung ô. */
  cell: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  /** Căn phải cho cột số/tiền. */
  align?: "left" | "right" | "center";
  headClassName?: string;
  cellClassName?: string;
  /** Ẩn cột dưới ngưỡng màn hình nhất định để mobile không bị chật. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  /** Số dòng skeleton khi loading. */
  skeletonRows?: number;
  error?: boolean;
  /** Thông báo lỗi cụ thể (vd. message từ API); thiếu thì dùng chuỗi mặc định. */
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  isRowSelected?: (row: T) => boolean;
  /** Cột đang sắp xếp + hướng. */
  sort?: { key: string; direction: SortDirection };
  onSortChange?: (key: string, direction: SortDirection) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Chiều cao tối đa vùng cuộn; header sẽ dính khi cuộn. */
  maxHeight?: string;
  /** Nội dung dưới bảng, thường là <Pagination />. */
  footer?: React.ReactNode;
  className?: string;
  /** Chiều rộng tối thiểu của bảng trước khi cho cuộn ngang. */
  minWidth?: string;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

const HIDE_BELOW: Record<NonNullable<DataTableColumn<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

/**
 * Bảng dữ liệu dùng chung: header dính, sắp xếp, trạng thái loading/rỗng/lỗi,
 * cuộn ngang trong khung riêng và ẩn cột theo breakpoint.
 *
 * Việc lấy/sắp xếp dữ liệu do phía gọi quyết định (thường là server-side) —
 * component này chỉ chịu trách nhiệm trình bày.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  error = false,
  errorTitle,
  errorDescription,
  onRetry,
  onRowClick,
  isRowSelected,
  sort,
  onSortChange,
  emptyTitle,
  emptyDescription,
  maxHeight,
  footer,
  className,
  minWidth = "44rem",
}: DataTableProps<T>) {
  const t = useTranslations();

  const headerCells = columns.map((column) => {
    const direction: SortDirection =
      sort?.key === column.key ? (sort.direction ?? null) : null;

    return (
      <TableHead
        key={column.key}
        aria-sort={
          direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined
        }
        className={cn(
          column.align && ALIGN[column.align],
          column.hideBelow && HIDE_BELOW[column.hideBelow],
          column.headClassName,
        )}
      >
        {column.sortable && onSortChange ? (
          <TableSortButton
            label={column.header}
            direction={direction}
            onSort={(next) => onSortChange(column.key, next)}
          />
        ) : (
          column.header
        )}
      </TableHead>
    );
  });

  function renderBody() {
    if (loading) {
      return Array.from({ length: skeletonRows }, (_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {columns.map((column) => (
            <TableCell
              key={column.key}
              className={cn(column.hideBelow && HIDE_BELOW[column.hideBelow])}
            >
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="py-14 text-center">
            <AlertTriangle className="mx-auto mb-3 size-8 text-destructive" />
            <p className="text-sm font-bold text-foreground">
              {errorTitle ?? t("common.states.errorTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {errorDescription ?? t("common.states.errorDescription")}
            </p>
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-4 cursor-pointer"
              >
                {t("common.actions.retry")}
              </Button>
            ) : null}
          </TableCell>
        </TableRow>
      );
    }

    if (rows.length === 0) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="py-14 text-center">
            <Inbox className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">
              {emptyTitle ?? t("common.states.emptyTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {emptyDescription ?? t("common.states.emptyDescription")}
            </p>
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row, index) => (
      <TableRow
        key={rowKey(row, index)}
        clickable={!!onRowClick}
        selected={isRowSelected?.(row)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {columns.map((column) => (
          <TableCell
            key={column.key}
            className={cn(
              column.align && ALIGN[column.align],
              column.hideBelow && HIDE_BELOW[column.hideBelow],
              column.cellClassName,
            )}
          >
            {column.cell(row, index)}
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <TableContainer style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
        <Table style={{ minWidth }}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">{headerCells}</TableRow>
          </TableHeader>
          {/* aria-busy để screen reader biết vùng đang tải lại */}
          <TableBody aria-busy={loading}>{renderBody()}</TableBody>
        </Table>
      </TableContainer>
      {footer}
    </div>
  );
}
