"use client";

import { MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { RatingStars } from "@/shared/components/common/rating-stars";
import { Button } from "@/shared/components/ui/button";
import { ImageGallery } from "@/shared/components/media/image-gallery";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { RatingSummary } from "@/types/Review";
import { usePublicReviews, useRatingSummary } from "../hooks/use-review";

const PAGE_SIZE = 5;

/**
 * Phổ điểm 1..5 sao. Chỉ một con số trung bình thì "4.2" của 5 lượt và của 500
 * lượt trông giống hệt nhau — thanh phân bố cho thấy đánh giá có bị phân cực không.
 */
function RatingDistribution({ summary }: { summary: RatingSummary }) {
  const t = useTranslations();
  const buckets: Array<[number, number]> = [
    [5, summary.rating5Count],
    [4, summary.rating4Count],
    [3, summary.rating3Count],
    [2, summary.rating2Count],
    [1, summary.rating1Count],
  ];
  const total = summary.totalReviews || 1;

  return (
    <dl className="mt-4 space-y-1.5">
      {buckets.map(([stars, value]) => (
        <div key={stars} className="flex items-center gap-2">
          <dt className="flex w-10 shrink-0 items-center gap-0.5 text-xs font-bold text-muted-foreground">
            {stars}
            <Star className="size-3 fill-current text-warning" />
          </dt>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-label={t("review.starsCount", { stars, count: value })}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={summary.totalReviews}
          >
            <div
              className="h-full rounded-full bg-warning"
              style={{ width: `${Math.round((value / total) * 100)}%` }}
            />
          </div>
          <dd className="w-8 shrink-0 text-right text-xs text-muted-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

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
  // Điểm TB + phổ điểm lấy từ endpoint tổng hợp riêng: `average`/`count` truyền
  // vào chỉ là số denorm trên hồ sơ, không có phân bố theo mức sao.
  const summary = useRatingSummary(scope, targetId).data;
  const items = query.data?.content ?? [];
  const total = query.data?.totalElements ?? summary?.totalReviews ?? count ?? 0;

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <MessageSquare className="size-5 text-primary" /> {t("review.publicTitle")}
        </h2>
        <RatingStars rating={summary?.averageRating ?? average} count={summary?.totalReviews ?? count} />
      </div>

      {!!summary?.totalReviews && <RatingDistribution summary={summary} />}

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
                {!!r.images?.length && (
                  <ImageGallery images={r.images} columns={6} className="mt-3" />
                )}
                <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  {r.createdAt && <span>{r.createdAt.slice(0, 10)}</span>}
                  {/* Ở trang gym: cho biết đánh giá thuộc buổi tập với PT nào. */}
                  {scope === "gym" && r.ptName && <span>· {r.ptName}</span>}
                  {scope === "pt" && r.gymName && <span>· {r.gymName}</span>}
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
