"use client";

import { MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { RatingStars } from "@/shared/components/common/rating-stars";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";
import { usePublicReviews } from "../hooks/use-review";

const PAGE_SIZE = 5;

/**
 * UC-009/069: khối đánh giá công khai của một gym/PT trên marketplace.
 *
 * Trước đây trang chi tiết chỉ hiện điểm trung bình nên khách không đọc được
 * nội dung đánh giá dù endpoint public đã có. Review là một chiều: chỉ hiển
 * thị nội dung khách viết, không có phần phản hồi.
 *
 * `average`/`count` lấy từ hồ sơ công khai (đã tính sẵn ở BE trên review
 * VISIBLE) nên tổng quan vẫn đúng kể cả khi danh sách chỉ tải trang đầu.
 */
export function PublicReviews({
  scope,
  targetId,
  average,
  count,
}: {
  scope: "gym" | "pt";
  targetId: number;
  average?: number | null;
  count?: number | null;
}) {
  const t = useTranslations();
  const [size, setSize] = useState(PAGE_SIZE);
  const query = usePublicReviews(scope, targetId, size);
  const items = query.data?.content ?? [];
  const total = query.data?.totalElements ?? count ?? 0;

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <MessageSquare className="size-5 text-primary" /> {t("review.publicTitle")}
        </h2>
        <RatingStars rating={average} count={count} />
      </div>

      {query.isLoading ? (
        <div className="mt-4"><LoadingSkeleton /></div>
      ) : query.isError ? (
        <div className="mt-4">
          <EmptyState title={t("review.loadError")} description={toErrorMessage(query.error)} />
        </div>
      ) : !items.length ? (
        <div className="mt-4">
          <EmptyState title={t("review.empty")} description={t("review.publicEmptyHint")} />
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {items.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-foreground">{r.customerName}</span>
                  <span className="flex items-center gap-1 text-sm font-black text-warning">
                    <Star className="size-4 fill-current" />
                    {r.rating}/5
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {r.comment || t("review.noContent")}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  {r.createdAt && <span>{r.createdAt.slice(0, 10)}</span>}
                  {/* Ở trang gym: cho biết đánh giá thuộc buổi tập với PT nào. */}
                  {scope === "gym" && r.ptName && <span>· {r.ptName}</span>}
                  {scope === "pt" && r.gymName && <span>· {r.gymName}</span>}
                  {r.serviceName && <span>· {r.serviceName}</span>}
                </div>
              </li>
            ))}
          </ul>
          {items.length < total && (
            <Button
              variant="outline"
              className="mt-4"
              disabled={query.isFetching}
              onClick={() => setSize((s) => s + PAGE_SIZE)}
            >
              {t("review.showMore", { count: total - items.length })}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
