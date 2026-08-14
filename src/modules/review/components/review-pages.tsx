"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Star } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { useGetMyTrainerProfile } from "@/modules/trainer/hooks/use-trainer";
import type { Review } from "@/services/review.service";
import type { Media } from "@/types/Media";
import { ImageGallery } from "@/shared/components/media/image-gallery";
import { ImageUploader } from "@/shared/components/media/image-uploader";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useDeleteReview,
  useReportReview,
  useReviews,
  useSaveReview,
} from "../hooks/use-review";
import { useReviewSchemas } from "../use-review-schemas";
import { useTranslations } from "next-intl";

export function CustomerReviewsPage() {
  return <ReviewPage scope="customer" />;
}

export function TrainerReviewsPage() {
  const t = useTranslations();
  const q = useGetMyTrainerProfile();
  if (q.isLoading) return <LoadingSkeleton />;
  /**
   * Hồ sơ PT hỏng -> targetId = 0 -> useReviews bị `enabled: id > 0` tắt hẳn, nên
   * query không loading cũng không error và màn hình báo "Chưa có đánh giá".
   * PT tưởng chưa ai đánh giá mình trong khi thực ra là request hồ sơ lỗi.
   */
  if (q.isError || !q.data?.id) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("common.states.errorTitle")}
        description={q.isError ? toErrorMessage(q.error) : t("common.states.errorDescription")}
        action={
          <Button type="button" variant="outline" onClick={() => q.refetch()}>
            {t("common.actions.retry")}
          </Button>
        }
      />
    );
  }
  return <ReviewPage scope="pt" targetId={q.data.id} />;
}

export function GymReviewsPage() {
  // getGymOwn trả review của mọi gym thuộc operator (mọi trạng thái) — không cần chọn gym.
  return <ReviewPage scope="gym" />;
}

/* Nhãn trạng thái review ở review.status.* */



function ReviewPage({
  scope,
  targetId = 0,
}: {
  scope: "customer" | "pt" | "gym";
  targetId?: number;
}) {
  const t = useTranslations();
  // Chỉ còn SỬA đánh giá đã có. Tạo mới nằm ở trang vé (đánh giá phòng gym) và
  // trang buổi tập (đánh giá PT) vì đối tượng đánh giá đi trong đường dẫn.
  const [editing, setEditing] = useState<Review | null>(null);
  const [reporting, setReporting] = useState<Review | null>(null);
  const query = useReviews(scope, targetId);
  const del = useDeleteReview();
  const { toast } = useToast();
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{t(`review.${scope}Title`)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(`review.${scope}Description`)}
          </p>
        </div>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={t("review.loadError")}
          description={toErrorMessage(query.error)}
        />
      ) : !items.length ? (
        <EmptyState
          title={t("review.empty")}
          description={t("review.emptyHint")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex justify-between">
                <p className="font-black">{r.customerName}</p>
                <span className="flex items-center gap-1 font-black text-accent">
                  <Star className="size-4 fill-current" />
                  {r.rating}/5
                </span>
              </div>
              {scope === "gym" && r.status !== "VISIBLE" && (
                <span className="mt-1 inline-block rounded-full bg-warning-muted px-2 py-0.5 text-[10px] font-black text-warning">
                  {t(`review.status.${r.status}`)}
                </span>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {r.comment || t("review.noContent")}
              </p>
              {!!r.images?.length && (
                <ImageGallery images={r.images} columns={4} className="mt-3" />
              )}
              <div className="mt-4 flex gap-2">
                {scope === "customer" ? (
                  <>
                    <Button onClick={() => setEditing(r)}>{t("common.actions.edit")}</Button>
                    <ConfirmDialog
                      label={t("common.actions.delete")}
                      title={t("review.deleteTitle")}
                      description={t("review.deleteBody")}
                      onConfirm={async () => {
                        await del.mutateAsync(r.id!);
                        toast({ type: "success", title: t("review.deleted") });
                      }}
                    />
                  </>
                ) : (
                  /* Review một chiều: gym/PT chỉ đọc, không phản hồi —
                     lối duy nhất tác động là báo cáo vi phạm (UC-070). */
                  <Button variant="outline" onClick={() => setReporting(r)}>
                    {t("review.reportViolation")}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <ReviewDialog review={editing} onClose={() => setEditing(null)} />}
      {reporting && (
        <ReportReviewDialog review={reporting} onClose={() => setReporting(null)} />
      )}
    </div>
  );
}

/**
 * Chọn sao bằng cách bấm thẳng vào sao. Dropdown "5/5" cũ đúng về dữ liệu nhưng
 * không ai đọc "đánh giá 4 sao" từ một ô select — với form đánh giá thì thanh sao
 * là kỳ vọng mặc định của người dùng.
 */
function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-2" onMouseLeave={() => setHover(0)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={t("review.rateStars", { count: star })}
            aria-pressed={value === star}
            className="rounded p-0.5 text-warning transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onClick={() => onChange(star)}
          >
            <Star className={`size-7 ${star <= shown ? "fill-current" : "fill-transparent"}`} />
          </button>
        ))}
      </div>
      <span className="text-sm font-bold text-muted-foreground">{shown}/5</span>
    </div>
  );
}

/** E-5 (UC-070): báo cáo review vi phạm — tạo case cho moderation (UC-071). */
function ReportReviewDialog({ review, onClose }: { review: Review; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const report = useReportReview();
  const [reason, setReason] = useState("");

  return (
    <Dialog open title={t("review.reportTitle", { name: review.customerName ?? "" })} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {t("review.reportHint")}
      </p>
      <Textarea
        className="mt-3"
        maxLength={500}
        rows={3}
        placeholder={t("review.reportPlaceholder")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
        <Button
          disabled={!reason.trim() || report.isPending}
          onClick={async () => {
            try {
              await report.mutateAsync({ id: review.id!, reason: reason.trim() });
              toast({ type: "success", title: t("review.reportSent"), description: t("review.reportSentDesc") });
              onClose();
            } catch (e) {
              toast({ type: "error", title: t("review.reportFailed"), description: toErrorMessage(e) });
            }
          }}
        >
          {report.isPending ? t("common.states.submitting") : t("review.sendReport")}
        </Button>
      </div>
    </Dialog>
  );
}

function ReviewDialog({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const save = useSaveReview();
  const schemas = useReviewSchemas();
  const [images, setImages] = useState<Media[]>(review.images ?? []);
  const form = useForm<z.infer<typeof schemas.review>>({
    resolver: zodResolver(schemas.review),
    defaultValues: {
      rating: review.rating,
      comment: review.comment ?? "",
      mediaIds: (review.images ?? []).map((m) => m.id),
    },
  });

  return (
    <Dialog open title={t("review.editTitle")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await save.mutateAsync({ id: review.id, payload: v });
            toast({ type: "success", title: t("review.saved") });
            onClose();
          } catch (e) {
            toast({
              type: "error",
              title: t("review.requestFailed"),
              description: toErrorMessage(e),
            });
          }
        })}
      >
        {/* Chọn đối tượng đánh giá đã chuyển sang chính trang vé (đánh giá phòng
            gym) và trang buổi tập (đánh giá PT) — câu 17 + 36. Dialog này giờ
            chỉ dùng để SỬA một đánh giá đã có. */}
        <FieldShell label={t("review.ratingLabel")} error={form.formState.errors.rating}>
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <StarRatingInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>
        <FieldShell label={t("review.contentLabel")} error={form.formState.errors.comment}>
          <Textarea {...form.register("comment")} aria-invalid={!!form.formState.errors.comment} />
        </FieldShell>
        <FieldShell label={t("review.imagesLabel")}>
          {/*
            entityId bỏ trống khi tạo mới: ảnh lên GCS ngay dưới dạng "nháp" và chỉ
            được gắn vào review khi bấm Lưu. Bỏ dở form thì job dọn rác của BE xoá.
            Khi sửa, entityId là id review nên ảnh gắn thẳng vào đúng bản ghi.
          */}
          <ImageUploader
            entityType="REVIEW"
            entityId={review?.id}
            imageType="REVIEW_IMAGE"
            value={images}
            onChange={(next) => {
              setImages(next);
              form.setValue("mediaIds", next.map((m) => m.id));
            }}
            max={5}
          />
        </FieldShell>
        <Button disabled={save.isPending}>{t("common.actions.saveChanges")}</Button>
      </form>
    </Dialog>
  );
}

