"use client";

import { formatCurrency } from "@/utils/format.util";
// Gói 2.E (audit 2026-07-17): các mảng BE-đủ-FE-thiếu của luồng booking —
// C-7 breakdown giá, C-11 timeline, C-6 session notes + hiệu chỉnh điểm danh,
// C-4 dời lịch, C-12 trạng thái hoàn tiền, C-2 danh sách chờ.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Loader2, NotebookPen, Trash2 } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import { bookingService, type Booking, type BookingStatus } from "@/services/booking.service";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { bookingKeys } from "../query-keys";
import type { BookingScope } from "../hooks/use-booking";
import type { RefundStatus } from "@/types/Booking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { DateTimePicker } from "@/shared/components/ui/date-time-picker";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/use-formatters";

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

/** C-7 (UC-034): khách phải thấy đúng số QR — tổng → giảm → điểm → PHẢI TRẢ. */
export function PriceBreakdown({ booking }: { booking: Booking }) {
  const t = useTranslations();
  if (booking.customerPackageId) {
    return <p className="mt-3 text-sm font-semibold text-success">{t("booking.fromPackageNote")}</p>;
  }
  const hasDiscount = (booking.discountAmount ?? 0) > 0 || (booking.loyaltyPointsUsed ?? 0) > 0;
  if (!hasDiscount && booking.payableAmount == null) return null;
  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>{t("booking.serviceTotal")}</span><span>{money(booking.totalAmount)}</span>
      </div>
      {(booking.discountAmount ?? 0) > 0 && (
        <div className="flex justify-between text-success">
          <span>{booking.voucherCode ? t("booking.discountWithCode", { code: booking.voucherCode }) : t("booking.discount")}</span>
          <span>-{money(booking.discountAmount)}</span>
        </div>
      )}
      {(booking.loyaltyPointsUsed ?? 0) > 0 && (
        <div className="flex justify-between text-success">
          <span>{t("booking.pointsUsedLabel")}</span><span>{booking.loyaltyPointsUsed} {t("booking.pointsUnit")}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between border-t border-border pt-1 font-black text-foreground">
        <span>{t("booking.payable")}</span><span>{money(booking.payableAmount ?? booking.totalAmount)}</span>
      </div>
    </div>
  );
}

/* Nhãn trạng thái booking dùng chung ở common.bookingStatus.* */

/** C-11 (UC-040): timeline trạng thái — endpoint 4 vai có sẵn, trước đây 0 UI. */
export function BookingTimeline({ bookingId, scope }: { bookingId: number; scope: BookingScope }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: [...bookingKeys.detail(bookingId), "history", scope],
    queryFn: () => (scope === "gym" ? bookingService.getGymHistory(bookingId) : bookingService.getHistory(bookingId)),
    enabled: open && scope !== "pt", // BE không có endpoint history cho PT
  });

  if (scope === "pt") return null;

  return (
    <div className="mt-4">
      <Button variant="link" size="inline" type="button" onClick={() => setOpen((v) => !v)}
 className="flex gap-1.5 text-sm text-primary">
        <Clock3 className="size-4" /> {open ? t("booking.hideTimeline") : t("booking.showTimeline")}
      </Button>
      {open && (
        query.isLoading ? (
          <div className="mt-2 h-10 animate-pulse rounded-xl bg-muted" />
        ) : query.isError ? (
          <p className="mt-2 text-xs text-destructive">{toErrorMessage(query.error)}</p>
        ) : !(query.data ?? []).length ? (
          <p className="mt-2 text-xs text-muted-foreground">{t("booking.noTimeline")}</p>
        ) : (
          <ul className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {(query.data ?? []).map((h, i) => (
              <li key={i} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
                <span className="font-semibold text-foreground">
                  {h.fromStatus ? t(`common.bookingStatus.${h.fromStatus}`) : "—"} → {h.toStatus ? t(`common.bookingStatus.${h.toStatus}`) : "—"}
                </span>
                <span className="text-muted-foreground"> · {fmt.dateTime(h.changedAt)}{h.changedBy ? ` · ${h.changedBy}` : ""}</span>
                {h.reason && <p className="mt-0.5 text-muted-foreground">{h.reason}</p>}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

/** C-6 (UC-048): ghi chú buổi tập — customer xem, gym/PT thêm. */
export function SessionNotesSection({ booking, scope }: { booking: Booking; scope: BookingScope }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const bookingId = booking.id;

  const canView = ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(booking.status);
  const canAdd = scope !== "customer" && ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(booking.status);

  const query = useQuery({
    queryKey: [...bookingKeys.detail(bookingId), "notes", scope],
    queryFn: () =>
      scope === "gym" ? bookingService.gymNotes(bookingId)
        : scope === "pt" ? bookingService.ptNotes(bookingId)
          : bookingService.notes(bookingId),
    enabled: open && canView,
  });

  const add = useMutation({
    mutationFn: () =>
      scope === "gym"
        ? bookingService.addGymNote(bookingId, note.trim())
        : bookingService.addPtNote(bookingId, note.trim()),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [...bookingKeys.detail(bookingId), "notes"] });
      setNote("");
      toast({ type: "success", title: t("booking.notesSaved") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  if (!canView) return null;

  return (
    <div className="mt-3">
      <Button variant="link" size="inline" type="button" onClick={() => setOpen((v) => !v)}
 className="flex gap-1.5 text-sm text-primary">
        <NotebookPen className="size-4" /> {open ? t("booking.hideNotes") : t("booking.showNotes")}
      </Button>
      {open && (
        <div className="mt-2 space-y-2">
          {query.isLoading ? (
            <div className="h-10 animate-pulse rounded-xl bg-muted" />
          ) : query.isError ? (
            <p className="text-xs text-destructive">{toErrorMessage(query.error)}</p>
          ) : !(query.data ?? []).length ? (
            <p className="text-xs text-muted-foreground">{t("booking.noNotes")}</p>
          ) : (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {(query.data ?? []).map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                  <p className="text-foreground">{n.note}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {n.author ? `${n.author} · ` : ""}{fmt.dateTime(n.createdAt)}
                    {n.evidenceUrl && (
                      <a href={n.evidenceUrl} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline">{t("booking.attachmentLink")}</a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {canAdd && (
            <div className="flex gap-2">
              <Input value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)}
                placeholder={t("booking.notePlaceholder")} className="text-sm" />
              <Button onClick={() => add.mutate()} disabled={!note.trim() || add.isPending}
                className="h-9 shrink-0 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                {add.isPending && <Loader2 className="size-3.5 animate-spin" />} {t("common.actions.add")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** C-4 (UC-041): dialog dời lịch — hook/endpoint có sẵn, trước đây 0 nút gọi. */
export function RescheduleDialog({
  booking,
  pending,
  onSubmit,
  onClose,
}: {
  booking: Booking;
  pending: boolean;
  onSubmit: (startAt: string, endAt: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const [start, setStart] = useState(booking.startAt?.slice(0, 16) ?? "");
  const [end, setEnd] = useState(booking.endAt?.slice(0, 16) ?? "");

  /**
   * Dời lịch phải chặn quá khứ GIỐNG màn đặt lịch (create-booking-wizard chặn bằng
   * minDate/minTime). Trước đây hai picker ở đây không có mốc nào: khách chọn được
   * ngày tuần trước, bấm "Dời lịch", và chỉ biết mình sai khi BE trả 409.
   * `slice(0,16)` khớp định dạng "yyyy-MM-ddTHH:mm" mà DateTimePicker dùng.
   */
  const nowLocal = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
    [],
  );
  const startInPast = !!start && start < nowLocal;
  const orderInvalid = !!start && !!end && start >= end;
  const invalid = !start || !end || orderInvalid || startInPast;

  return (
    <Dialog open title={t("booking.rescheduleTitle", { id: booking.id })} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {t("booking.rescheduleHint")}
      </p>
      {/* 2 cột cứng bóp hai picker xuống ~150px trên điện thoại. */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("booking.start")}</label>
          <DateTimePicker
            value={start}
            onChange={(v) => setStart(v ?? "")}
            minDateTime={nowLocal}
            aria-invalid={startInPast}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("booking.end")}</label>
          <DateTimePicker
            value={end}
            onChange={(v) => setEnd(v ?? "")}
            minDateTime={start || nowLocal}
            aria-invalid={orderInvalid}
          />
        </div>
      </div>
      {startInPast && (
        <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
          {t("booking.validation.timeInPast")}
        </p>
      )}
      {orderInvalid && <p role="alert" className="mt-2 text-xs text-destructive">{t("booking.timeInvalid")}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
        <Button disabled={invalid || pending} onClick={() => onSubmit(start + ":00", end + ":00")}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          {pending && <Loader2 className="size-4 animate-spin" />} {t("booking.reschedule")}
        </Button>
      </div>
    </Dialog>
  );
}

const REFUND_VARIANT: Record<RefundStatus, "default" | "success" | "destructive" | "warning"> = {
  PENDING: "warning", APPROVED: "success", REJECTED: "destructive", EXECUTED: "success",
};

/** C-12/D-6 (UC-055): khách theo dõi trạng thái yêu cầu hoàn tiền — trước đây "mù". */
export function RefundStatusSection() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: [...bookingKeys.all, "my-refunds"],
    queryFn: () => bookingService.myRefunds(),
    enabled: open,
  });
  const items = query.data?.content ?? [];

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/80 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="text-sm font-black uppercase tracking-wide text-muted-foreground hover:text-foreground">
        {open ? "▾" : "▸"} {t("booking.myRefunds")}
      </button>
      {open && (
        query.isLoading ? (
          <div className="mt-3 h-10 animate-pulse rounded-xl bg-muted" />
        ) : query.isError ? (
          <p className="mt-3 text-xs text-destructive">{toErrorMessage(query.error)}</p>
        ) : !items.length ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("booking.noRefunds")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Booking #{r.bookingId} · {money(r.amount)}</p>
                  {r.decisionNote && <p className="truncate text-xs text-muted-foreground">{r.decisionNote}</p>}
                </div>
                <Badge variant={REFUND_VARIANT[r.status]}>{t(`common.refundStatus.${r.status}`)}</Badge>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}

/** C-2 (UC-044): danh sách chờ của khách — BE đủ join/leave/my, trước đây FE = 0 dòng. */
export function WaitlistSection() {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: [...bookingKeys.all, "waitlist"],
    queryFn: () => bookingService.myWaitlist(),
    enabled: open,
  });

  const leave = useMutation({
    mutationFn: (id: number) => bookingService.leaveWaitlist(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [...bookingKeys.all, "waitlist"] });
      toast({ type: "success", title: t("booking.leftWaitlist") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/80 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="text-sm font-black uppercase tracking-wide text-muted-foreground hover:text-foreground">
        {open ? "▾" : "▸"} {t("booking.myWaitlist")}
      </button>
      {open && (
        query.isLoading ? (
          <div className="mt-3 h-10 animate-pulse rounded-xl bg-muted" />
        ) : query.isError ? (
          <p className="mt-3 text-xs text-destructive">{toErrorMessage(query.error)}</p>
        ) : !(query.data ?? []).length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("booking.noWaitlist")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(query.data ?? []).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{w.serviceName ?? w.packageName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("booking.preferred")} {fmt.dateTime(w.preferredStart)}{w.note ? ` · ${w.note}` : ""}
                  </p>
                </div>
                <IconButton tooltip={t("booking.leaveWaitlist")} onClick={() => w.id != null && leave.mutate(w.id)} disabled={leave.isPending}
                  className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}

/** C-6 (UC-050, phía gym): hiệu chỉnh điểm danh / COMPLETED↔NO_SHOW kèm lý do. */
export function CorrectAttendanceDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();
  const [target, setTarget] = useState<BookingStatus>(booking.status === "NO_SHOW" ? "COMPLETED" : "NO_SHOW");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => bookingService.correctAttendance(booking.id, { status: target, reason: reason.trim() }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: bookingKeys.all });
      toast({ type: "success", title: t("booking.corrected") });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={t("booking.correctTitle", { id: booking.id })} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {t("booking.correctHint")}
      </p>
      <div className="mt-3 space-y-3">
        <Select value={target} onValueChange={(v) => setTarget(v as BookingStatus)}>
          <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="COMPLETED">{t("admin.bookings.toCompleted")}</SelectItem>
            <SelectItem value="NO_SHOW">{t("admin.bookings.toNoShow")}</SelectItem>
          </SelectContent>
        </Select>
        <Textarea value={reason} maxLength={500} rows={3} onChange={(e) => setReason(e.target.value)}
          placeholder={t("booking.correctReasonPlaceholder")} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button onClick={() => mutation.mutate()}
            disabled={!reason.trim() || target === booking.status || mutation.isPending}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
