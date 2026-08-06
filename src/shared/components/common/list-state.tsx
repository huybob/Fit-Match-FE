"use client";

import { AlertTriangle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";

/**
 * Ba trạng thái của một danh sách: đang tải / lỗi / rỗng.
 *
 * Vì sao cần dùng chung: các trang danh sách dạng thẻ trước đây viết tay
 * `isLoading ? spinner : items.length === 0 ? empty : list` — KHÔNG có nhánh lỗi.
 * Khi API hỏng, `items` vẫn là [] nên màn hình hiện "Chưa có dữ liệu": người dùng
 * tưởng mình chưa có gì, trong khi thực ra server lỗi, và không có nút thử lại.
 * (Trang dùng DataTable không dính lỗi này vì DataTable đã tách sẵn `error`.)
 *
 * Dùng:
 *   <ListState query={query} isEmpty={!items.length} emptyTitle={…} emptyDescription={…}>
 *     <div className="grid …">{items.map(…)}</div>
 *   </ListState>
 */
export function ListState({
  query,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  skeletonCount = 3,
  skeletonClassName = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
  children,
}: {
  query: { isLoading: boolean; isError: boolean; error?: unknown; refetch?: () => void };
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  skeletonCount?: number;
  skeletonClassName?: string;
  children: ReactNode;
}) {
  const t = useTranslations();

  if (query.isLoading) {
    return (
      <div aria-busy="true" aria-live="polite" className={skeletonClassName}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="mt-4 h-5 w-2/3 rounded-full" />
            <Skeleton className="mt-2 h-4 w-full rounded-full" />
            <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("common.states.errorTitle")}
        description={query.error ? toErrorMessage(query.error) : t("common.states.errorDescription")}
        action={
          query.refetch ? (
            <Button type="button" variant="outline" onClick={() => query.refetch?.()}>
              {t("common.actions.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
