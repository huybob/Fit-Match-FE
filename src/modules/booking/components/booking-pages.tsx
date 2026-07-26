"use client";

import { formatCurrency } from "@/utils/format.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarDays, MapPin, Plus, QrCode, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { Booking, BookingStatus, bookingService } from "@/services/booking.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { TimePicker } from "@/shared/components/ui/time-picker";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "../query-keys";
import { marketplaceService } from "@/services/marketplace.service";
import { useOpenDispute } from "@/modules/dispute/hooks/use-dispute";
import { voucherService } from "@/services/voucher.service";
import { loyaltyService } from "@/services/loyalty.service";
import {
  BookingAction,
  BookingScope,
  useBookingAction,
  useBookingPayment,
  useBookings,
  useCreateBooking,
  useMyPackages,
  useRescheduleBooking,
} from "../hooks/use-booking";
import { useBookingSchemas } from "../use-booking-schemas";
import { gymService } from "@/services/gym.service";
import {
  BookingTimeline,
  CorrectAttendanceDialog,
  PriceBreakdown,
  RefundStatusSection,
  RescheduleDialog,
  SessionNotesSection,
  WaitlistSection,
} from "./booking-detail-extras";
import { useTranslations } from "next-intl";
import { Pagination } from "@/shared/components/ui/pagination";
import { useFormatters } from "@/i18n/use-formatters";

const statuses: BookingStatus[] = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PENDING_GYM",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "NO_SHOW",
  "COMPLETED",
];

/* Nhãn nằm trong booking.scope.* / common.bookingStatus.* / booking.success.*
   — key trùng tên nên resolve động trong component. */

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);
function statusVariant(status?: BookingStatus): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED" || status === "CANCELLED" || status === "NO_SHOW") return "destructive";
  if (status === "CONFIRMED") return "info";
  if (status === "PENDING_PAYMENT" || status === "PENDING_GYM") return "warning";
  return "default";
}
/** `fallback` truyền từ component vì helper thường không gọi được hook. */
function itemName(booking: Booking, fallback: string) {
  return booking.serviceName ?? booking.packageName ?? fallback;
}

export function BookingWorkspacePage({ scope }: { scope: BookingScope }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);
  const [prefill, setPrefill] = useState<{ gymId?: number; packageId?: number }>({});
  const [payingId, setPayingId] = useState<number | null>(null);
  const query = useBookings(scope, { status: status || undefined, page, size: 10, sort: ["id,desc"] });
  const items = query.data?.content ?? [];

  // Bug 10: deep-link ?create=1&gymId=&packageId= từ trang gym/gói tập ->
  // tự mở dialog tạo lịch với gym/gói đã chọn sẵn.
  useEffect(() => {
    if (scope !== "customer" || typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("create") === "1") {
      const gymId = Number(sp.get("gymId") ?? "");
      const packageId = Number(sp.get("packageId") ?? "");
      setPrefill({
        gymId: Number.isFinite(gymId) && gymId > 0 ? gymId : undefined,
        packageId: Number.isFinite(packageId) && packageId > 0 ? packageId : undefined,
      });
      setCreating(true);
    }
  }, [scope]);

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:p-7">
        <div className="absolute -right-10 -top-16 size-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
            <h1 className="text-3xl font-black tracking-tight">{t(`booking.scope.${scope}Title`)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t(`booking.scope.${scope}Description`)}</p>
          </div>
          {scope === "customer" && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />{t("booking.create")}
            </Button>
          )}
        </div>
      </section>

      {/* C-12 + C-2: khách theo dõi hoàn tiền + danh sách chờ ngay trong workspace */}
      {scope === "customer" && <RefundStatusSection />}
      {scope === "customer" && <WaitlistSection />}

      <section className="mb-5 grid gap-3 rounded-2xl border border-border bg-card/80 p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t("common.table.status")}</span>
          <Select value={status} onValueChange={(v) => { setStatus(v as BookingStatus | ""); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("common.filters.allStatuses")}</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{t(`common.bookingStatus.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {query.isLoading ? <LoadingSkeleton /> : query.isError ? (
        <EmptyState title={t("booking.loadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("booking.emptyTitle")} description={scope === "customer" ? t("booking.emptyAll") : t("booking.emptyFiltered")} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((booking) => (
            <button
              type="button"
              key={booking.id}
              onClick={() => setSelected(booking)}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">#{booking.id}</p>
                  <h2 className="mt-1 text-lg font-black group-hover:text-accent">{itemName(booking, t("booking.unnamedService"))}</h2>
                </div>
                <Badge variant={statusVariant(booking.status)}>
                  {booking.status ? t(`common.bookingStatus.${booking.status}`) : "—"}
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent" />{fmt.dateTime(booking.startAt)}</span>
                <span className="flex items-center gap-2"><UserRound className="size-4 text-primary" />{scope === "customer" ? (booking.ptDisplayName ?? t("booking.noTrainerAssigned")) : booking.customerUsername}</span>
                <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" />{booking.branchName ?? booking.gymName}</span>
                <strong className="text-foreground">{money(booking.totalAmount)}</strong>
              </div>
            </button>
          ))}
        </div>
      )}

      <Pagination
        className="mt-6"
        page={page}
        zeroBased
        totalPages={query.data?.totalPages ?? 0}
        totalItems={query.data?.totalElements}
        onPageChange={setPage}
        disabled={query.isLoading}
      />

      <BookingDetailDialog
        booking={selected}
        scope={scope}
        onClose={() => setSelected(null)}
        onPay={(id) => { setSelected(null); setPayingId(id); }}
      />
      {scope === "customer" && (
        <CreateBookingDialog
          open={creating}
          initialGymId={prefill.gymId}
          initialPackageId={prefill.packageId}
          onClose={() => setCreating(false)}
          onCheckedOut={(id, payable) => { setCreating(false); if (payable > 0) setPayingId(id); }}
        />
      )}
      <PaymentDialog bookingId={payingId} onClose={() => setPayingId(null)} />
    </div>
  );
}

function BookingDetailDialog({ booking, scope, onClose, onPay }: {
  booking: Booking | null;
  scope: BookingScope;
  onClose: () => void;
  onPay: (id: number) => void;
}) {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const action = useBookingAction(scope);
  const openDispute = useOpenDispute();
  const reschedule = useRescheduleBooking(scope);
  const [confirming, setConfirming] = useState<{ action: BookingAction; label: string; message?: string; requireMessage?: boolean } | null>(null);
  const [disputeReason, setDisputeReason] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  // C-5 (UC-039): gym chọn PT khi nhận lịch / đổi PT sau khi nhận.
  const [acceptPtId, setAcceptPtId] = useState("");
  const [reassignPtId, setReassignPtId] = useState("");
  const gymPts = useQuery({
    queryKey: ["gym-pts", "for-booking"],
    queryFn: () => gymService.listPts({ page: 0, size: 100 }),
    enabled: scope === "gym" && !!booking,
  });
  const activePts = (gymPts.data?.content ?? []).filter((p) => p.status === "ACTIVE");
  const client = useQueryClient();
  const reassign = useMutation({
    mutationFn: ({ id, ptId }: { id: number; ptId: number }) => bookingService.assignPt(id, ptId),
    onSuccess: () => client.invalidateQueries({ queryKey: bookingKeys.all }),
  });
  if (!booking) return null;

  // UC-063: mở tranh chấp cho booking đã phát sinh dịch vụ/tiền.
  // D-18 (chốt 2026-07-17, phương án A): chỉ trong DISPUTE_WINDOW_DAYS ngày kể từ
  // khi buổi kết thúc (endAt) — giữ đồng bộ với app.dispute.open-window-days phía BE.
  // (Với REJECTED/CANCELLED, BE neo theo thời điểm hủy — FE dùng endAt làm xấp xỉ
  // thận trọng; nếu FE ẩn nhầm thì cũng chỉ sớm hơn hạn thật, không mở lố.)
  const DISPUTE_WINDOW_DAYS = 14;
  const disputeAnchor = booking.endAt ? new Date(booking.endAt).getTime() : Date.now();
  const withinDisputeWindow =
    Date.now() <= disputeAnchor + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const canDispute =
    ["CONFIRMED", "COMPLETED", "NO_SHOW", "REJECTED", "CANCELLED"].includes(booking.status)
    && withinDisputeWindow;

  async function submitDispute() {
    if (!bookingId || !disputeReason?.trim()) {
      toast({ type: "warning", title: t("booking.disputeReasonRequired") });
      return;
    }
    try {
      await openDispute.mutateAsync({ bookingId, reason: disputeReason.trim() });
      toast({ type: "success", title: t("booking.disputeOpened"), description: t("booking.disputeOpenedDesc") });
      setDisputeReason(null);
      onClose();
    } catch (e) {
      toast({ type: "error", title: t("booking.disputeFailed"), description: toErrorMessage(e) });
    }
  }

  const bookingId = booking.id;
  const status = booking.status;
  const actions: Array<{ action: BookingAction; label: string; requireMessage?: boolean }> = [];
  const checkedIn = !!booking.checkedInAt;
  if (scope === "customer") {
    if (status === "DRAFT") actions.push({ action: "checkout", label: t("booking.submitAndPay") });
    if (status === "CONFIRMED" && !checkedIn) actions.push({ action: "checkIn", label: "Check-in" });
    if (["DRAFT", "PENDING_PAYMENT", "PENDING_GYM", "CONFIRMED"].includes(status)) {
      actions.push({ action: "cancel", label: t("booking.cancelBooking") });
    }
    if (["REJECTED", "CANCELLED", "NO_SHOW"].includes(status)) {
      actions.push({ action: "refund", label: t("booking.requestRefund"), requireMessage: true });
    }
  }
  if (scope === "pt" && status === "CONFIRMED" && !checkedIn) {
    actions.push({ action: "checkIn", label: t("booking.checkInGuest") });
  }
  if (scope === "gym") {
    if (status === "PENDING_GYM") {
      actions.push({ action: "accept", label: t("booking.accept") });
      actions.push({ action: "reject", label: t("common.actions.reject"), requireMessage: true });
    }
    if (status === "CONFIRMED") {
      if (!checkedIn) actions.push({ action: "checkIn", label: t("booking.checkInGuest") });
      actions.push({ action: "complete", label: t("booking.complete") });
      actions.push({ action: "noShow", label: t("booking.noShow") });
      actions.push({ action: "cancel", label: t("booking.cancelBooking"), requireMessage: true });
    }
  }

  async function run() {
    if (!confirming || !bookingId) return;
    if (confirming.requireMessage && !confirming.message?.trim()) {
      toast({ type: "warning", title: t("booking.reasonRequired") });
      return;
    }
    try {
      await action.mutateAsync({
        id: bookingId,
        action: confirming.action,
        message: confirming.message,
        // C-5: gán PT ngay khi nhận lịch (BE recheck PT thuộc gym + lịch rảnh).
        ptId: confirming.action === "accept" && acceptPtId ? Number(acceptPtId) : undefined,
      });
      toast({ type: "success", title: t(`booking.success.${confirming.action}`) });
      const done = confirming.action;
      setConfirming(null);
      onClose();
      // Sau checkout có phí -> mở QR thanh toán ngay.
      if (done === "checkout" && (booking?.payableAmount ?? 0) > 0) onPay(bookingId);
    } catch (error) {
      toast({ type: "error", title: t("booking.requestFailed"), description: toErrorMessage(error) });
    }
  }

  return (
    <Dialog open title={t("booking.detailTitle")} onClose={onClose}>
      <div className="rounded-2xl bg-muted/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">{itemName(booking, t("booking.unnamedService"))}</h3>
          <Badge variant={statusVariant(status)}>{status ? t(`common.bookingStatus.${status}`) : "—"}</Badge>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Info label={t("booking.customer")} value={booking.customerUsername} />
          <Info label={t("booking.trainer")} value={booking.ptDisplayName ?? t("booking.notAssigned")} />
          <Info label={t("booking.location")} value={[booking.gymName, booking.branchName].filter(Boolean).join(" · ")} />
          <Info label={t("booking.schedule")} value={`${fmt.dateTime(booking.startAt)} → ${fmt.dateTime(booking.endAt)}`} />
          <Info label={t("booking.total")} value={booking.customerPackageId ? t("booking.fromPurchasedPackage") : money(booking.totalAmount)} />
          <Info label={t("booking.checkInLabel")} value={booking.checkedInAt ? fmt.dateTime(booking.checkedInAt) : t("booking.notCheckedIn")} />
        </dl>
        {/* C-7: breakdown giá — khách thấy đúng số phải trả (khớp QR) */}
        <PriceBreakdown booking={booking} />
        {booking.lateCancellation && (
          <p className="mt-2 rounded-xl border border-warning/30 bg-warning-muted p-3 text-xs font-semibold text-warning">
            {t("booking.lateCancelWarning")}
          </p>
        )}
        {booking.statusReason && (
          <p className="mt-4 rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">{booking.statusReason}</p>
        )}
        {booking.customerNote && (
          <p className="mt-2 rounded-2xl border border-border bg-card p-3 text-sm">{booking.customerNote}</p>
        )}
        {/* C-11 + C-6: timeline trạng thái + ghi chú buổi tập */}
        <BookingTimeline bookingId={booking.id} scope={scope} />
        <SessionNotesSection booking={booking} scope={scope} />
      </div>

      {scope === "customer" && status === "PENDING_PAYMENT" && (
        <Button className="mt-4 w-full" variant="outline" onClick={() => bookingId && onPay(bookingId)}>
          <QrCode className="size-4" />{t("booking.viewQr")}
        </Button>
      )}

      {!!actions.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((item) => (
            <Button
              key={item.action}
              variant={["cancel", "noShow", "reject"].includes(item.action) ? "destructive" : "default"}
              onClick={() => setConfirming(item)}
            >
              {item.label}
            </Button>
          ))}
          {/* C-4 (UC-041): dời lịch — customer & gym, trước khi buổi diễn ra */}
          {scope !== "pt" && ["PENDING_GYM", "CONFIRMED"].includes(status) && (
            <Button variant="outline" onClick={() => setRescheduling(true)}>{t("booking.reschedule")}</Button>
          )}
          {/* C-6 (UC-050): gym hiệu chỉnh bản ghi hoàn tất/vắng mặt */}
          {scope === "gym" && ["COMPLETED", "NO_SHOW"].includes(status) && (
            <Button variant="outline" onClick={() => setCorrecting(true)}>{t("booking.correctAttendance")}</Button>
          )}
        </div>
      )}

      {/* C-5 (UC-039): gym đổi PT cho booking đã nhận */}
      {scope === "gym" && status === "CONFIRMED" && (
        <div className="mt-3 flex items-center gap-2">
          <Select value={reassignPtId} onValueChange={setReassignPtId}>
            <SelectTrigger className="h-9 flex-1 text-sm">
              <SelectValue placeholder={t("booking.reassignTrainer")} />
            </SelectTrigger>
            <SelectContent>
              {activePts.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.displayName ?? p.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={!reassignPtId || reassign.isPending}
            onClick={async () => {
              try {
                await reassign.mutateAsync({ id: booking.id, ptId: Number(reassignPtId) });
                toast({ type: "success", title: t("booking.trainerReassigned") });
                setReassignPtId("");
                onClose();
              } catch (e) {
                toast({ type: "error", title: t("booking.reassignFailed"), description: toErrorMessage(e) });
              }
            }}
          >
            {t("booking.assignTrainer")}
          </Button>
        </div>
      )}

      {canDispute && disputeReason === null && (
        <Button variant="link" size="inline"
 type="button"
 onClick={() => setDisputeReason("")}
 className="mt-3 text-sm text-destructive"
>
          {t("booking.openDispute")}
        </Button>
      )}

      {disputeReason !== null && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-black">{t("booking.openDisputeFor", { id: bookingId })}</p>
          <Textarea
            className="mt-3"
            maxLength={1000}
            placeholder={t("booking.disputePlaceholder")}
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button variant="destructive" disabled={openDispute.isPending} onClick={() => void submitDispute()}>
              {openDispute.isPending ? t("common.states.submitting") : t("booking.submitDispute")}
            </Button>
            <Button variant="outline" onClick={() => setDisputeReason(null)}>{t("common.actions.cancel")}</Button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="mt-5 rounded-2xl border border-warning/30 bg-warning-muted p-4">
          <p className="font-black">{t("booking.confirmPrompt", { label: confirming.label })}</p>
          {/* C-5 (UC-039): chọn PT phụ trách ngay khi nhận lịch */}
          {confirming.action === "accept" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                {t("booking.assignedTrainerLabel", {
                  suffix: booking.ptDisplayName
                    ? t("booking.customerSuggested", { name: booking.ptDisplayName })
                    : t("common.form.optionalLabel"),
                })}
              </label>
              <Select value={acceptPtId} onValueChange={setAcceptPtId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={t("booking.keepCustomerChoice")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("booking.keepCustomerChoice")}</SelectItem>
                  {activePts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.displayName ?? p.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(confirming.requireMessage || ["cancel", "reject", "refund"].includes(confirming.action)) && (
            <Textarea
              className="mt-3"
              maxLength={500}
              placeholder={confirming.requireMessage ? t("booking.reasonRequiredLabel") : t("gym.ptOps.reasonOptional")}
              value={confirming.message ?? ""}
              onChange={(e) => setConfirming({ ...confirming, message: e.target.value })}
            />
          )}
          <div className="mt-3 flex gap-2">
            <Button disabled={action.isPending} onClick={() => void run()}>
              {action.isPending ? t("common.states.processing") : t("common.actions.confirm")}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(null)}>{t("common.actions.cancel")}</Button>
          </div>
        </div>
      )}

      {rescheduling && (
        <RescheduleDialog
          booking={booking}
          pending={reschedule.isPending}
          onClose={() => setRescheduling(false)}
          onSubmit={async (startAt, endAt) => {
            try {
              await reschedule.mutateAsync({ id: booking.id, startAt, endAt });
              toast({ type: "success", title: t("booking.rescheduled") });
              setRescheduling(false);
              onClose();
            } catch (e) {
              toast({ type: "error", title: t("booking.rescheduleFailed"), description: toErrorMessage(e) });
            }
          }}
        />
      )}
      {correcting && (
        <CorrectAttendanceDialog booking={booking} onClose={() => { setCorrecting(false); onClose(); }} />
      )}
    </Dialog>
  );
}

// Bug 8: BE chỉ bật endpoint mô phỏng ở profile local/dev — FE cũng chỉ hiện nút khi dev.
const DEV_PAYMENT_ENABLED =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEV_PAYMENT === "1";

/** UC-052: hiển thị VietQR để khách chuyển khoản; Casso tự đối soát (UC-053). */
function PaymentDialog({ bookingId, onClose }: { bookingId: number | null; onClose: () => void }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useBookingPayment(bookingId ?? 0, bookingId !== null);
  // Bug 8 (dev): mô phỏng ngân hàng xác nhận để test thông luồng gói tháng.
  const simulate = useMutation({
    mutationFn: () => bookingService.simulatePayment(bookingId!),
    onSuccess: () => {
      toast({ type: "success", title: t("booking.paySimulated") });
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (e) => toast({ type: "error", title: t("booking.paySimulateFailed"), description: toErrorMessage(e) }),
  });
  if (bookingId === null) return null;
  const order = query.data;

  return (
    <Dialog open title={t("booking.payTitle")} onClose={onClose}>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError || !order ? (
        <EmptyState title={t("booking.payLoadError")} description={toErrorMessage(query.error)} />
      ) : order.status === "PAID" ? (
        // Bug 9: kết quả thanh toán hiển thị rõ ràng thay vì chỉ dòng trạng thái thô.
        <div className="grid gap-3 py-4 text-center">
          <CalendarCheck2 className="mx-auto size-12 text-success" />
          <p className="text-lg font-black text-success">{t("booking.paySuccess")}</p>
          <p className="text-sm text-muted-foreground">
            {t("booking.payReceived", { amount: money(order.amount), id: bookingId })}
          </p>
          <Button className="mx-auto" onClick={onClose}>{t("common.actions.close")}</Button>
        </div>
      ) : order.status === "EXPIRED" || order.status === "CANCELLED" ? (
        <div className="grid gap-3 py-4 text-center">
          <QrCode className="mx-auto size-12 text-destructive" />
          <p className="text-lg font-black text-destructive">
            {order.status === "EXPIRED" ? t("booking.orderExpired") : t("booking.orderCancelled")}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.status === "EXPIRED"
              ? t("booking.orderExpiredBody")
              : t("booking.orderClosedBody")}
          </p>
          <Button className="mx-auto" onClick={onClose}>{t("common.actions.close")}</Button>
        </div>
      ) : (
        <div className="grid gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t("booking.scanHintPrefix")}
            <strong className="mx-1 text-foreground">{order.refCode}</strong>
            {t("booking.scanHintSuffix")}
          </p>
          {order.qrContent && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.qrContent} alt="VietQR" className="mx-auto w-64 max-w-full rounded-xl border border-border" />
          )}
          <div className="grid gap-1 text-sm">
            <span>{t("booking.amountLabel")} <strong>{money(order.amount)}</strong></span>
            <span>{t("booking.statusAwaitingPayment")}</span>
            {order.expiresAt && <span className="text-muted-foreground">{t("booking.expiresLabel")} {fmt.dateTime(order.expiresAt)}</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("booking.afterTransfer")}
          </p>
          {DEV_PAYMENT_ENABLED && (
            <Button
              variant="outline"
              className="mx-auto"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate()}
            >
              {simulate.isPending ? t("booking.simulating") : t("booking.simulatePay")}
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-bold text-foreground">{value || "—"}</dd>
    </div>
  );
}

/** UC-031/032/035: chọn gym -> dịch vụ/gói (+PT/chi nhánh) -> tạo nháp -> checkout. */
function CreateBookingDialog({ open, onClose, onCheckedOut, initialGymId, initialPackageId }: {
  open: boolean;
  onClose: () => void;
  onCheckedOut: (bookingId: number, payable: number) => void;
  /** Bug 10: gym/gói chọn sẵn khi mở từ deep-link trang gym / gói tập. */
  initialGymId?: number;
  initialPackageId?: number;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const create = useCreateBooking();
  const checkoutAction = useBookingAction("customer");
  const [voucherCode, setVoucherCode] = useState("");
  const [pointsToUse, setPointsToUse] = useState("");
  // C-2 (UC-044): đề nghị vào danh sách chờ khi slot đã kín (409).
  const [waitlistOffer, setWaitlistOffer] = useState<{
    serviceId?: number; packageId?: number; preferredStart: string;
  } | null>(null);
  const joinWaitlist = useMutation({
    mutationFn: () => bookingService.joinWaitlist(waitlistOffer!),
    onSuccess: () => {
      toast({ type: "success", title: t("booking.joinedWaitlist"), description: "Xem tại mục 'Danh sách chờ của tôi'." });
      setWaitlistOffer(null);
    },
    onError: (e) => toast({ type: "error", title: t("booking.joinWaitlistFailed"), description: toErrorMessage(e) }),
  });
  const loyalty = useQuery({ queryKey: ["loyalty", "balance-mini"], queryFn: () => loyaltyService.balance(), enabled: open });

  const schemas = useBookingSchemas();
  const form = useForm<z.infer<typeof schemas.createBooking>>({
    resolver: zodResolver(schemas.createBooking),
    defaultValues: {
      mode: "new",
      gymId: 0,
      itemType: "service",
      itemId: 0,
      bookingDate: new Date().toISOString().slice(0, 10),
      startTime: "08:00",
      endTime: "09:00",
      note: "",
    },
  });
  const mode = form.watch("mode");
  const gymId = form.watch("gymId") ?? 0;
  const itemType = form.watch("itemType");

  // Bug 10: áp prefill từ deep-link mỗi khi dialog mở.
  useEffect(() => {
    if (!open) return;
    if (initialGymId) {
      form.setValue("gymId", initialGymId);
    }
    if (initialPackageId) {
      form.setValue("itemType", "package");
      form.setValue("itemId", initialPackageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialGymId, initialPackageId]);
  // B-31/C-15 (UC-030): pre-check slot ngay khi chọn giờ — trước đây khách chỉ biết
  // slot bận sau khi submit và nhận 409, để lại DRAFT rác.
  const watchPtId = form.watch("ptId");
  const watchBranchId = form.watch("branchId");
  const watchDate = form.watch("bookingDate");
  const watchStart = form.watch("startTime");
  const watchEnd = form.watch("endTime");
  const precheckEnabled =
    open && !!(watchPtId || watchBranchId) && !!watchDate && !!watchStart && !!watchEnd && watchStart < watchEnd;
  const precheck = useQuery({
    queryKey: ["availability-check", watchPtId, watchBranchId, watchDate, watchStart, watchEnd],
    queryFn: () =>
      bookingService.checkAvailability({
        ptId: watchPtId || undefined,
        branchId: watchBranchId || undefined,
        startAt: `${watchDate}T${watchStart}:00`,
        endAt: `${watchDate}T${watchEnd}:00`,
      }),
    enabled: precheckEnabled,
    staleTime: 15_000,
  });

  const myPackages = useMyPackages(open);
  const usablePackages = (myPackages.data ?? []).filter((p) => p.status === "ACTIVE" && p.sessionsRemaining > 0);

  const gyms = useQuery({
    queryKey: ["marketplace", "gyms", "booking"],
    queryFn: () => marketplaceService.searchGyms({ size: 100 }),
    enabled: open && mode === "new",
  });
  const services = useQuery({
    queryKey: ["marketplace", "gym", gymId, "services"],
    queryFn: () => marketplaceService.getGymServices(gymId),
    enabled: open && gymId > 0,
  });
  const packages = useQuery({
    queryKey: ["marketplace", "gym", gymId, "packages"],
    queryFn: () => marketplaceService.getGymPackages(gymId),
    enabled: open && gymId > 0,
  });
  // Ở chế độ dùng gói, gym được suy ra từ gói đã chọn.
  const selectedPackage = usablePackages.find((p) => p.id === form.watch("customerPackageId"));
  const effectiveGymId = mode === "package" ? (selectedPackage?.gymId ?? 0) : gymId;

  const branches = useQuery({
    queryKey: ["marketplace", "gym", effectiveGymId, "branches"],
    queryFn: () => marketplaceService.getGymBranches(effectiveGymId),
    enabled: open && effectiveGymId > 0,
  });
  const pts = useQuery({
    queryKey: ["marketplace", "gym", effectiveGymId, "pts"],
    queryFn: () => marketplaceService.getGymPts(effectiveGymId),
    enabled: open && effectiveGymId > 0,
  });

  const catalogItems = itemType === "service" ? (services.data ?? []) : (packages.data ?? []);

  return (
    <Dialog open={open} title={t("booking.create")} onClose={onClose}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const booking = await create.mutateAsync({
              serviceId: values.mode === "new" && values.itemType === "service" ? values.itemId : undefined,
              packageId: values.mode === "new" && values.itemType === "package" ? values.itemId : undefined,
              customerPackageId: values.mode === "package" ? values.customerPackageId : undefined,
              branchId: values.branchId,
              ptId: values.ptId,
              startAt: `${values.bookingDate}T${values.startTime}:00`,
              endAt: `${values.bookingDate}T${values.endTime}:00`,
              note: values.note || undefined,
            });
            // UC-073: áp giảm giá (voucher hoặc điểm — loại trừ nhau) trước checkout; lỗi không chặn đặt lịch.
            if (values.mode === "new" && voucherCode.trim()) {
              try {
                await voucherService.apply(booking.id, voucherCode.trim());
              } catch (err) {
                toast({ type: "warning", title: t("booking.voucherFailed"), description: toErrorMessage(err) });
              }
            } else if (values.mode === "new" && Number(pointsToUse) > 0) {
              try {
                await loyaltyService.apply(booking.id, Number(pointsToUse));
              } catch (err) {
                toast({ type: "warning", title: t("booking.pointsFailed"), description: toErrorMessage(err) });
              }
            }
            // UC-035: checkout ngay sau khi tạo nháp — BE validate đủ điều kiện + chốt giá.
            try {
              const checked = await checkoutAction.mutateAsync({ id: booking.id, action: "checkout" });
              const payable = (checked as Booking).payableAmount ?? 0;
              toast({
                type: "success",
                title: payable > 0 ? t("booking.createdPayNow") : t("booking.sentToGym"),
              });
              form.reset();
              onCheckedOut(booking.id, payable);
            } catch (checkoutError) {
              // B-31: checkout lỗi -> hủy nháp vừa tạo để không dồn nháp trùng khung giờ
              // (trước đây mỗi lần thử lại để lại 1 "Bản nháp" giống hệt).
              await bookingService.cancel(booking.id, { reason: t("booking.autoCancelDraft") }).catch(() => undefined);
              throw checkoutError;
            }
          } catch (error) {
            toast({ type: "error", title: t("booking.createFailed"), description: toErrorMessage(error) });
            // C-2 (UC-044): chỉ mời vào danh sách chờ khi slot thật sự kín/bận (409 do
            // capacity hoặc PT trùng lịch) — không mời khi lỗi cấu hình giờ hoạt động.
            const status = (error as { status?: number })?.status;
            const message = toErrorMessage(error);
            const slotTaken = /kín chỗ|đã có lịch/i.test(message);
            if (status === 409 && slotTaken && values.mode === "new" && values.itemId) {
              setWaitlistOffer({
                serviceId: values.itemType === "service" ? values.itemId : undefined,
                packageId: values.itemType === "package" ? values.itemId : undefined,
                preferredStart: `${values.bookingDate}T${values.startTime}:00`,
              });
            }
          }
        })}
      >
        <div className="sm:col-span-2">
          <FieldShell label={t("booking.modeLabel")}>
            <Controller
              control={form.control}
              name="mode"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => { field.onChange(v); form.setValue("itemId", 0); form.setValue("customerPackageId", undefined); form.setValue("ptId", undefined); form.setValue("branchId", undefined); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t("booking.modeNew")}</SelectItem>
                    <SelectItem value="package" disabled={!usablePackages.length}>
                      {usablePackages.length
                        ? t("booking.modePackageCount", { count: usablePackages.length })
                        : t("booking.modePackageNone")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FieldShell>
        </div>

        {mode === "package" ? (
          <div className="sm:col-span-2">
            <FieldShell label={t("booking.purchasedPackage")} error={form.formState.errors.customerPackageId}>
              <Controller
                control={form.control}
                name="customerPackageId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => { field.onChange(Number(v)); form.setValue("ptId", undefined); form.setValue("branchId", undefined); }}
                  >
                    <SelectTrigger><SelectValue placeholder={t("booking.selectPackage")} /></SelectTrigger>
                    <SelectContent>
                      {usablePackages.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {t("booking.packageRemaining", { name: p.packageName ?? "", gym: p.gymName ?? "", left: p.sessionsRemaining ?? 0, total: p.sessionsTotal ?? 0 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldShell>
          </div>
        ) : (
          <>
            <div className="sm:col-span-2">
              <FieldShell label={t("booking.gymLabel")} error={form.formState.errors.gymId}>
                <Controller
                  control={form.control}
                  name="gymId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => { field.onChange(Number(v)); form.setValue("itemId", 0); form.setValue("ptId", undefined); form.setValue("branchId", undefined); }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={gyms.isFetching ? t("common.states.loading") : t("booking.selectGym")} />
                      </SelectTrigger>
                      <SelectContent>
                        {gyms.data?.content?.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>{g.gymName}{g.city ? ` · ${g.city}` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldShell>
            </div>

            <FieldShell label={t("booking.typeLabel")} error={form.formState.errors.itemType}>
              <Controller
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("itemId", 0); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">{t("booking.typeSingle")}</SelectItem>
                      <SelectItem value="package">{t("booking.typePackage")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldShell>

            <FieldShell label={itemType === "service" ? t("marketplace.services") : t("booking.typePackage")} error={form.formState.errors.itemId}>
              <Controller
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={!gymId || !catalogItems.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!gymId ? t("booking.selectGymFirst") : (services.isFetching || packages.isFetching) ? t("common.states.loading") : catalogItems.length ? t("booking.selectPlaceholder") : t("booking.gymHasNothing")} />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogItems.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name} · {money(item.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldShell>
          </>
        )}

        <FieldShell label={t("booking.branchOptional")} error={form.formState.errors.branchId}>
          <Controller
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                disabled={!gymId || !branches.data?.length}
              >
                <SelectTrigger><SelectValue placeholder={t("booking.noSelection")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("booking.noSelection")}</SelectItem>
                  {branches.data?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>

        <FieldShell label={t("booking.trainerOptional")} error={form.formState.errors.ptId}>
          <Controller
            control={form.control}
            name="ptId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                disabled={!gymId || !pts.data?.content?.length}
              >
                <SelectTrigger><SelectValue placeholder={t("booking.gymAssigns")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("booking.gymAssigns")}</SelectItem>
                  {pts.data?.content?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.displayName}{p.specialization ? ` · ${p.specialization}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>

        <FieldShell label={t("booking.bookingDate")} error={form.formState.errors.bookingDate}>
          <Controller
            control={form.control}
            name="bookingDate"
            render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
          />
        </FieldShell>
        <FieldShell label={t("booking.startTime")} error={form.formState.errors.startTime}>
          <Controller
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <TimePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />
            )}
          />
        </FieldShell>
        <FieldShell label={t("booking.endTime")} error={form.formState.errors.endTime}>
          <Controller
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <TimePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />
            )}
          />
        </FieldShell>

        {mode === "new" && (
          <>
            <FieldShell label={t("booking.voucherOptional")}>
              <Input value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); if (e.target.value) setPointsToUse(""); }} placeholder="VD: SALE10" />
            </FieldShell>
            <FieldShell label={t("booking.usePoints", { balance: loyalty.data?.pointsBalance ?? 0 })}>
              <Input
                type="number"
                min={0}
                max={loyalty.data?.pointsBalance ?? 0}
                value={pointsToUse}
                onChange={(e) => { setPointsToUse(e.target.value); if (e.target.value) setVoucherCode(""); }}
                placeholder="0"
                disabled={!!voucherCode.trim() || !(loyalty.data?.pointsBalance)}
              />
            </FieldShell>
          </>
        )}

        <div className="sm:col-span-2">
          <FieldShell label={t("booking.noteOptional")} error={form.formState.errors.note}>
            <Textarea {...form.register("note")} placeholder={t("booking.notePlaceholder2")} />
          </FieldShell>
        </div>

        {/* B-31: kết quả pre-check khả dụng cho khung giờ đã chọn */}
        {precheckEnabled && precheck.data && (
          precheck.data.available ? (
            <p className="sm:col-span-2 rounded-xl border border-success/30 bg-success-muted px-3 py-2 text-xs font-semibold text-success">
              {t("booking.slotAvailable")}
            </p>
          ) : (
            <div className="sm:col-span-2 rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
              <p className="font-semibold">{t("booking.slotUnavailable")}</p>
              <ul className="mt-1 list-inside list-disc">
                {precheck.data.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )
        )}

        {waitlistOffer && (
          <div className="sm:col-span-2 rounded-2xl border border-warning/30 bg-warning-muted p-4">
            <p className="text-sm font-black text-warning">{t("booking.slotFullOfferTitle")}</p>
            <p className="mt-1 text-xs text-warning">
              {t("booking.slotFullOfferBody")}
            </p>
            <div className="mt-2 flex gap-2">
              <Button type="button" disabled={joinWaitlist.isPending} onClick={() => joinWaitlist.mutate()}>
                {joinWaitlist.isPending ? t("common.states.processing") : t("booking.joinWaitlist")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setWaitlistOffer(null)}>{t("booking.skip")}</Button>
            </div>
          </div>
        )}

        <Button className="sm:col-span-2" disabled={create.isPending || checkoutAction.isPending}>
          <CalendarCheck2 className="size-4" />
          {create.isPending || checkoutAction.isPending ? t("common.states.processing") : t("booking.bookAndPay")}
        </Button>
      </form>
    </Dialog>
  );
}
