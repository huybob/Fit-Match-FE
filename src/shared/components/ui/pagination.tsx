"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/shared/utils/cn.util";

const ELLIPSIS = "ellipsis" as const;
type PageToken = number | typeof ELLIPSIS;

/**
 * Sinh dãy trang có dấu "…" thay vì liệt kê toàn bộ trang.
 * Luôn giữ trang đầu, trang cuối, trang hiện tại và `siblings` trang hai bên.
 */
export function buildPageTokens(
  current: number,
  total: number,
  siblings = 1,
): PageToken[] {
  // Số ô tối đa: đầu + cuối + hiện tại + 2 sibling + 2 dấu "…"
  const maxSlots = siblings * 2 + 5;
  if (total <= maxSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);

  const tokens: PageToken[] = [1];
  if (left > 2) tokens.push(ELLIPSIS);

  for (let page = Math.max(left, 2); page <= Math.min(right, total - 1); page += 1) {
    tokens.push(page);
  }

  if (right < total - 1) tokens.push(ELLIPSIS);
  tokens.push(total);
  return tokens;
}

export interface PaginationProps {
  /** Trang hiện tại. Đánh số từ 1, hoặc từ 0 nếu bật `zeroBased`. */
  page: number;
  /** Tổng số trang. */
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Bật khi state phía ngoài đánh số trang từ 0 (như API phân trang của BE).
   * Component vẫn hiển thị số trang từ 1 cho người dùng, chỉ phần vào/ra là 0-based.
   */
  zeroBased?: boolean;
  /** Tổng số bản ghi — để hiện "Hiện 1–20 trong 137". */
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Hiện nút về trang đầu / tới trang cuối. */
  showEdgeButtons?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Phân trang đầy đủ: nút trước/sau, dấu "…" cho danh sách dài,
 * chọn số dòng mỗi trang, và mô tả khoảng bản ghi đang xem.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  zeroBased = false,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showEdgeButtons = true,
  disabled = false,
  className,
}: PaginationProps) {
  const t = useTranslations();

  const total = Math.max(totalPages, 1);
  // Bên trong luôn làm việc với số trang 1-based; chỉ quy đổi ở ranh giới vào/ra.
  const current = Math.min(Math.max(zeroBased ? page + 1 : page, 1), total);
  const emit = (next: number) => onPageChange(zeroBased ? next - 1 : next);
  const tokens = React.useMemo(() => buildPageTokens(current, total), [current, total]);

  const atStart = current <= 1;
  const atEnd = current >= total;

  const from = pageSize ? (current - 1) * pageSize + 1 : undefined;
  const to =
    pageSize && totalItems !== undefined
      ? Math.min(current * pageSize, totalItems)
      : pageSize
        ? current * pageSize
        : undefined;

  return (
    <nav
      aria-label={t("common.pagination.label")}
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-3 sm:flex-row",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {totalItems !== undefined && from !== undefined && to !== undefined ? (
          <p aria-live="polite" className="text-xs font-semibold text-muted-foreground">
            {t("common.pagination.showing", { from, to, total: totalItems })}
          </p>
        ) : null}

        {onPageSizeChange && pageSize ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
              {t("common.pagination.rowsPerPage")}
            </span>
            <Select
              value={String(pageSize)}
              disabled={disabled}
              onValueChange={(next) => onPageSizeChange(Number(next))}
            >
              <SelectTrigger
                aria-label={t("common.pagination.rowsPerPage")}
                className="h-9 w-[4.5rem] cursor-pointer text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="cursor-pointer text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        {showEdgeButtons ? (
          <IconButton
            variant="outline"
            tooltip={t("common.pagination.first")}
            disabled={disabled || atStart}
            onClick={() => emit(1)}
          >
            <ChevronsLeft className="size-4" />
          </IconButton>
        ) : null}

        <IconButton
          variant="outline"
          tooltip={t("common.pagination.previous")}
          disabled={disabled || atStart}
          onClick={() => emit(current - 1)}
        >
          <ChevronLeft className="size-4" />
        </IconButton>

        {tokens.map((token, index) =>
          token === ELLIPSIS ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="inline-flex size-9 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </span>
          ) : (
            <Button
              key={token}
              type="button"
              variant={token === current ? "default" : "outline"}
              size="icon-sm"
              disabled={disabled}
              aria-label={t("common.pagination.goToPage", { page: token })}
              aria-current={token === current ? "page" : undefined}
              onClick={() => emit(token)}
              className={cn(
                "cursor-pointer tabular-nums",
                token === current && "pointer-events-none",
              )}
            >
              {token}
            </Button>
          ),
        )}

        <IconButton
          variant="outline"
          tooltip={t("common.pagination.next")}
          disabled={disabled || atEnd}
          onClick={() => emit(current + 1)}
        >
          <ChevronRight className="size-4" />
        </IconButton>

        {showEdgeButtons ? (
          <IconButton
            variant="outline"
            tooltip={t("common.pagination.last")}
            disabled={disabled || atEnd}
            onClick={() => emit(total)}
          >
            <ChevronsRight className="size-4" />
          </IconButton>
        ) : null}
      </div>
    </nav>
  );
}
