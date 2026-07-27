"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareReply, Plus, Star } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { useGetMyTrainerProfile } from "@/modules/trainer/hooks/use-trainer";
import type { Review } from "@/services/review.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useBookings } from "@/modules/booking/hooks/use-booking";
import {
  useDeleteReview,
  useReplyReview,
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
  const q = useGetMyTrainerProfile();
  if (q.isLoading) return <LoadingSkeleton />;
  return <ReviewPage scope="pt" targetId={q.data?.id ?? 0} />;
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
  const [editing, setEditing] = useState<Review | null | undefined>();
  const [replying, setReplying] = useState<Review | null>(null);
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
        {scope === "customer" && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            {t("review.write")}
          </Button>
        )}
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
              {r.reply && (
                <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
                  <b>{r.repliedByName}:</b> {r.reply}
                </div>
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
                  <>
                    <Button onClick={() => setReplying(r)}>
                      <MessageSquareReply className="size-4" />
                      {t("review.reply")}
                    </Button>
                    {/* E-5 (UC-070): gym/PT báo cáo review vi phạm — hook có sẵn, trước đây 0 UI */}
                    <Button variant="outline" onClick={() => setReporting(r)}>
                      {t("review.reportViolation")}
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ReviewDialog review={editing} onClose={() => setEditing(undefined)} />
      )}
      {replying && (
        <ReplyDialog review={replying} onClose={() => setReplying(null)} />
      )}
      {reporting && (
        <ReportReviewDialog review={reporting} onClose={() => setReporting(null)} />
      )}
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
  review: Review | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const save = useSaveReview();
  const bookingsQuery = useBookings("customer", {
    status: "COMPLETED",
    page: 0,
    size: 50,
  });
  const completed = bookingsQuery.data?.content ?? [];
  const schemas = useReviewSchemas();
  const form = useForm<z.infer<typeof schemas.review>>({
    resolver: zodResolver(schemas.review),
    defaultValues: {
      bookingId: review?.bookingId ?? 0,
      rating: review?.rating ?? 5,
      comment: review?.comment ?? "",
    },
  });

  return (
    <Dialog
      open
      title={review ? t("review.editTitle") : t("review.write")}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await save.mutateAsync({ id: review?.id, payload: v });
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
        <FieldShell label={t("review.bookingLabel")} error={form.formState.errors.bookingId}>
          {review ? (
            <Input
              disabled
              value={`#${review.bookingId} · ${review.ptName ?? ""}`}
            />
          ) : bookingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.states.processing")}</p>
          ) : !completed.length ? (
            <p className="text-sm text-muted-foreground">
              {t("review.noCompleted")}
            </p>
          ) : (
            <Controller
              control={form.control}
              name="bookingId"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("review.selectBooking")} />
                  </SelectTrigger>
                  <SelectContent>
                    {completed.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        #{b.id} · {b.serviceName ?? b.packageName ?? ""} · {b.ptDisplayName ?? ""} · {b.startAt ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FieldShell>
        <FieldShell label={t("review.ratingLabel")} error={form.formState.errors.rating}>
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((v) => (
                    <SelectItem key={v} value={String(v)}>{v}/5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
        <FieldShell label={t("review.contentLabel")} error={form.formState.errors.comment}>
          <Textarea {...form.register("comment")} aria-invalid={!!form.formState.errors.comment} />
        </FieldShell>
        <Button>{t("common.actions.saveChanges")}</Button>
      </form>
    </Dialog>
  );
}

function ReplyDialog({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const mutation = useReplyReview();
  const schemas = useReviewSchemas();
  const form = useForm<z.infer<typeof schemas.reply>>({
    resolver: zodResolver(schemas.reply),
    defaultValues: { reply: review.reply ?? "" },
  });

  return (
    <Dialog open title={t("review.reply")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync({ id: review.id!, reply: v.reply });
            toast({ type: "success", title: t("review.replySent") });
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
        <FieldShell label={t("review.reply")} error={form.formState.errors.reply}>
          <Textarea {...form.register("reply")} aria-invalid={!!form.formState.errors.reply} />
        </FieldShell>
        <Button>{t("review.sendReply")}</Button>
      </form>
    </Dialog>
  );
}
