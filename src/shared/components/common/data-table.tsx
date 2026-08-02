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
  /**
   * Bug S2-10: giá trị dùng để sắp xếp phía client. Khai báo `sortValue` là cột
   * tự sắp xếp được (cao→thấp / thấp→cao) mà trang gọi KHÔNG phải tự giữ state —
   * `cell` thường trả JSX nên không so sánh trực tiếp được.
   *
   * Chỉ dùng cho bảng đã tải hết dữ liệu của trang hiện tại. Bảng phân trang
   * server-side muốn sắp xếp trên toàn bộ tập dữ liệu thì vẫn truyền
   * `sortable` + `sort` + `onSortChange` như cũ (server-side thắng).
   */
  sortValue?: (row: T) => string | number | boolean | null | undefined;
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

  // Bug S2-10: sắp xếp phía client cho các bảng chưa nối sort server-side.
  // Chỉ bật khi trang gọi KHÔNG tự quản lý sort — server-side luôn thắng.
  const [localSort, setLocalSort] = React.useState<{ key: string; direction: SortDirection } | null>(null);
  const clientSort = !onSortChange;
  const activeSort = clientSort ? localSort : sort;

  const sortedRows = React.useMemo(() => {
    if (!clientSort || !activeSort?.direction) return rows;
    const column = columns.find((c) => c.key === activeSort.key);
    if (!column?.sortValue) return rows;
    const factor = activeSort.direction === "asc" ? 1 : -1;
    // Bản sao: rows là prop, sort() tại chỗ sẽ đột biến state của trang gọi.
    return [...rows].sort((a, b) => {
      const va = column.sortValue!(a);
      const vb = column.sortValue!(b);
      // Ô trống luôn xuống cuối, bất kể chiều sắp xếp — "chưa có dữ liệu" không
      // phải là "nhỏ nhất", và đẩy chúng lên đầu khi asc chỉ gây nhiễu.
      const emptyA = va == null || va === "";
      const emptyB = vb == null || vb === "";
      if (emptyA || emptyB) return emptyA && emptyB ? 0 : emptyA ? 1 : -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * factor;
    });
  }, [clientSort, activeSort, columns, rows]);

  const headerCells = columns.map((column) => {
    const direction: SortDirection =
      activeSort?.key === column.key ? (activeSort.direction ?? null) : null;
    const canSort = clientSort ? !!column.sortValue : !!(column.sortable && onSortChange);
    const handleSort = (next: SortDirection) =>
      clientSort ? setLocalSort({ key: column.key, direction: next }) : onSortChange!(column.key, next);

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
        {canSort ? (
          <TableSortButton label={column.header} direction={direction} onSort={handleSort} />
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

    if (sortedRows.length === 0) {
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

    return sortedRows.map((row, index) => (
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
