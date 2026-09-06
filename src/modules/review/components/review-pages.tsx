"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Star } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { useGetMyTrainerProfile } from "@/modules/trainer/hooks/use-trainer";
import type { Review } from "@/services/review.service";
import type { Media } from "@/types/Media";
import { ImageGallery } from "@/shared/components/media/image-gallery";
import { StarRatingInput } from "./star-rating-input";
import { ReviewCreateDialog } from "./review-create-dialog";
import { useFormatters } from "@/i18n/use-formatters";
import { useMySessions, useMyTickets } from "@/modules/ticket/hooks/use-ticket";
import { addDays, fromIsoDate, todayIso } from "@/modules/ticket/calendar-date.util";
import type { Ticket, TrainingSession } from "@/types/Ticket";
import { ImageUploader } from "@/shared/components/media/image-uploader";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useDeleteReview,
  useMyReviewedTargets,
  useReportReview,
  useReviews,
  useSaveReview,
} from "../hooks/use-review";
import { useReviewSchemas } from "../use-review-schemas";
import { useTranslations } from "next-intl";

/**
 * Đánh giá của chính khách, TÁCH hai loại — cùng lý do với {@link GymReviewsPage}.
 *
 * <p>Trước đây là một danh sách phẳng, và mỗi thẻ chỉ in tên người đánh giá —
 * tức là tên của CHÍNH người đang xem. Khách mở trang ra thấy tên mình lặp lại
 * mười lần mà không có chỗ nào nói mình đã chấm phòng gym nào hay huấn luyện
 * viên nào. Hai tab trả lời hai câu khác nhau, và thẻ giờ in ĐỐI TƯỢNG được
 * chấm thay cho cái tên vô nghĩa kia.
 */
export function CustomerReviewsPage() {
  const [targetType, setTargetType] = useState<"GYM" | "PT">("GYM");

  return (
    <ReviewPage
      scope="customer"
      targetType={targetType}
      tabs={<ReviewTypeTabs value={targetType} onChange={setTargetType} />}
    />
  );
}

/** Dải chip GYM / PT — dùng chung cho trang của khách và trang của phòng gym. */
function ReviewTypeTabs({
  value,
  onChange,
}: {
  value: "GYM" | "PT";
  onChange: (next: "GYM" | "PT") => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-4 flex gap-1.5">
      {(["GYM", "PT"] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            value === type
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(type === "GYM" ? "review.tabGym" : "review.tabPt")}
        </button>
      ))}
    </div>
  );
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

/**
 * Đánh giá của gym mình, TÁCH hai loại. Đánh giá PT cũng lưu gymProfile (để hiện
 * đúng ngữ cảnh phòng tập) nên danh sách cũ trộn chung: gym mở trang ra thấy lẫn
 * lộn điểm chấm phòng tập với điểm chấm từng huấn luyện viên, không phân biệt
 * được cái nào nói về mình. Hai tab là hai câu hỏi khác nhau: "khách nghĩ gì về
 * phòng gym" và "khách nghĩ gì về HLV của tôi".
 *
 * getGymOwn trả review của mọi gym thuộc operator (mọi trạng thái) — không cần chọn gym.
 */
export function GymReviewsPage() {
  const [targetType, setTargetType] = useState<"GYM" | "PT">("GYM");

  return (
    <ReviewPage
      scope="gym"
      targetType={targetType}
      tabs={<ReviewTypeTabs value={targetType} onChange={setTargetType} />}
    />
  );
}

/**
 * Những thứ ĐANG CHỜ khách chấm điểm, ngay trên danh sách đã chấm.
 *
 * <p>Hai tab trước đây chỉ ĐỌC: khách mở tab "Về huấn luyện viên" mà chưa chấm
 * ai thì nhận đúng một dòng "Chưa có đánh giá" và hết đường đi. Lối tạo đánh giá
 * có tồn tại nhưng nằm rải ở nơi khác — trong thẻ vé đã dùng hết, và trong hộp
 * chi tiết một buổi tập trên lịch — nên muốn chấm điểm thì phải nhớ ra buổi nào,
 * vé nào, rồi tự đi tìm. Ở đây gom lại đúng hai câu mà mỗi tab đang hỏi.
 *
 * <p>Điều kiện mở khớp từng chữ với BE (ReviewServiceImpl):
 * phòng gym chấm theo VÉ khi vé đã USED_UP; HLV chấm theo BUỔI khi buổi đã DONE
 * và buổi đó có HLV. Lệch một điều kiện là mời khách bấm vào rồi nhận 409.
 */
function PendingReviews({
  targetType,
  reviewed,
}: {
  targetType: "GYM" | "PT";
  reviewed: ReturnType<typeof useMyReviewedTargets>;
}) {
  const t = useTranslations();
  const [gymTarget, setGymTarget] = useState<Ticket | null>(null);
  const [ptTarget, setPtTarget] = useState<TrainingSession | null>(null);
  const fmt = useFormatters();

  /*
   * Vé đã dùng hết — lọc status ở SERVER: vé đã dùng hết là số ít so với toàn bộ
   * vé của khách, kéo hết về rồi lọc ở client là tải thừa cả một lịch sử mua vé.
   */
  const usedUp = useMyTickets({ status: "USED_UP", size: 100 });

  /*
   * Buổi đã tập xong. `/sessions/my` nhận khoảng ngày nên phải chọn một cửa sổ:
   * BE KHÔNG giới hạn thời gian được đánh giá, nên cửa sổ này chỉ là phạm vi
   * NHẮC — buổi cũ hơn vẫn chấm được qua hộp chi tiết buổi trên lịch. Nói rõ
   * phạm vi trong phần mô tả thay vì im lặng cắt bớt.
   */
  const from = addDays(todayIso(), -PENDING_PT_LOOKBACK_DAYS);
  const doneSessions = useMySessions(from, todayIso(), targetType === "PT");
  // Buổi chỉ mang ticketId; tên phòng gym nằm ở vé. Ghép ở client bằng một Map
  // thay vì gọi thêm API cho từng buổi — cùng cách lịch đặt vẫn làm.
  const allTickets = useMyTickets({ size: 100 });
  const ticketById = useMemo(
    () => new Map((allTickets.data?.content ?? []).map((item) => [item.id, item])),
    [allTickets.data],
  );

  const pendingGym = useMemo(
    () =>
      (usedUp.data?.content ?? []).filter((ticket) => !reviewed.ticketIds.has(ticket.id)),
    [usedUp.data, reviewed.ticketIds],
  );
  const pendingPt = useMemo(
    () =>
      (doneSessions.data ?? []).filter(
        (session) =>
          session.status === "DONE"
          && session.ptProfileId != null
          && !reviewed.sessionIds.has(session.id),
      ),
    [doneSessions.data, reviewed.sessionIds],
  );

  const items = targetType === "GYM" ? pendingGym : pendingPt;
  if (!items.length) return null;

  return (
    <section className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <h2 className="text-sm font-black text-foreground">
        {t("review.pendingTitle", { count: items.length })}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t(targetType === "GYM" ? "review.pendingGymHint" : "review.pendingPtHint", {
          days: PENDING_PT_LOOKBACK_DAYS,
        })}
      </p>

      <ul className="mt-3 space-y-2">
        {targetType === "GYM"
          ? pendingGym.map((ticket) => (
              <li
                key={ticket.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{ticket.gymName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.ticketTypeName} · {ticket.gymBranchName}
                  </p>
                </div>
                <Button size="sm" onClick={() => setGymTarget(ticket)}>
                  <Star className="mr-1.5 size-3.5" />
                  {t("review.rateGym")}
                </Button>
              </li>
            ))
          : pendingPt.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{session.ptName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fmt.date(fromIsoDate(session.sessionDate))}
                    {ticketById.get(session.ticketId)?.gymName
                      ? ` · ${ticketById.get(session.ticketId)?.gymName}`
                      : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => setPtTarget(session)}>
                  <Star className="mr-1.5 size-3.5" />
                  {t("review.ratePt")}
                </Button>
              </li>
            ))}
      </ul>

      {gymTarget && (
        <ReviewCreateDialog
          target={{ kind: "gym", ticketId: gymTarget.id, name: gymTarget.gymName }}
          onClose={() => setGymTarget(null)}
        />
      )}
      {ptTarget && (
        <ReviewCreateDialog
          target={{
            kind: "pt",
            sessionId: ptTarget.id,
            name: ptTarget.ptName ?? "",
            // Ngày hiển thị, không phải ISO thô: câu dẫn của form là câu đọc.
            date: fmt.date(fromIsoDate(ptTarget.sessionDate)),
          }}
          onClose={() => setPtTarget(null)}
        />
      )}
    </section>
  );
}

/**
 * Phạm vi NHẮC đánh giá HLV. Không phải hạn chót — BE không giới hạn thời gian,
 * buổi cũ hơn vẫn chấm được từ hộp chi tiết buổi trên lịch.
 */
const PENDING_PT_LOOKBACK_DAYS = 180;

/* Nhãn trạng thái review ở review.status.* */



function ReviewPage({
  scope,
  targetId = 0,
  targetType,
  tabs,
}: {
  scope: "customer" | "pt" | "gym";
  targetId?: number;
  /** Chỉ dùng cho scope gym: lọc đánh giá phòng gym hay đánh giá HLV. */
  targetType?: "GYM" | "PT";
  /** Bộ chuyển tab, hiện dưới tiêu đề. */
  tabs?: React.ReactNode;
}) {
  const t = useTranslations();
  // Danh sách này chỉ SỬA đánh giá đã có. Việc TẠO nằm ở PendingReviews ngay bên
  // trên (và ở đúng chỗ phát sinh: thẻ vé, hộp chi tiết buổi tập) vì đối tượng
  // đánh giá đi trong đường dẫn của API.
  const [editing, setEditing] = useState<Review | null>(null);
  const [reporting, setReporting] = useState<Review | null>(null);
  const query = useReviews(scope, targetId, targetType);
  const del = useDeleteReview();
  const { toast } = useToast();
  const reviewed = useMyReviewedTargets();
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
          {tabs}
        </div>
      </section>

      {/* Chờ chấm điểm lên TRƯỚC danh sách đã chấm: đó là việc còn phải làm,
          còn danh sách dưới là việc đã xong. */}
      {scope === "customer" && targetType ? (
        <PendingReviews targetType={targetType} reviewed={reviewed} />
      ) : null}

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={t("review.loadError")}
          description={toErrorMessage(query.error)}
        />
      ) : !items.length ? (
        /*
          Rỗng theo TỪNG TAB, và nói ra khi nào thì đánh giá mới mở — "Chưa có
          đánh giá" trơn để khách đứng lại không biết phải làm gì mới được chấm.
          Chỉ dùng câu này cho scope KHÁCH: với gym/PT thì tab rỗng nghĩa là chưa
          ai chấm HỌ, nói "bạn chưa đánh giá..." là đổi hẳn chủ ngữ.
        */
        <EmptyState
          title={
            scope === "customer" && targetType
              ? t(targetType === "PT" ? "review.emptyPt" : "review.emptyGym")
              : t("review.empty")
          }
          description={
            scope === "customer" && targetType
              ? t(targetType === "PT" ? "review.emptyPtHint" : "review.emptyGymHint")
              : t("review.emptyHint")
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex justify-between gap-3">
                {/*
                  Ở trang của khách, `customerName` là tên của CHÍNH người đang
                  xem — in ra không nói thêm được gì. Thứ họ cần là đối tượng đã
                  chấm: huấn luyện viên nào, hay phòng gym nào.
                */}
                <div className="min-w-0">
                  <p className="truncate font-black">
                    {scope === "customer"
                      ? (r.targetType === "PT" ? r.ptName : r.gymName) ?? t("review.unknownTarget")
                      : r.customerName}
                  </p>
                  {/* Đánh giá HLV vẫn gắn phòng gym — nói ra chỗ tập thì khách
                      mới nhớ ra buổi nào, nhất là khi họ tập ở nhiều nơi. */}
                  {scope === "customer" && r.targetType === "PT" && r.gymName ? (
                    <p className="truncate text-xs text-muted-foreground">{r.gymName}</p>
                  ) : null}
                </div>
                <span className="flex shrink-0 items-center gap-1 font-black text-accent">
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

