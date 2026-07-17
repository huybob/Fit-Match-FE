"use client";

import { formatCurrency } from "@/utils/format.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, QrCode, UserRound } from "lucide-react";
import { useState } from "react";
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
import { createBookingSchema } from "../schemas";
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

const scopeTitles: Record<string, string> = {
  customerTitle: "Đặt lịch của tôi",
  ptTitle: "Lịch được phân công",
  gymTitle: "Lịch đặt tại phòng gym",
  customerDescription: "Đặt dịch vụ/gói tập, thanh toán VietQR và theo dõi trạng thái.",
  ptDescription: "Các buổi tập bạn được gym phân công (chỉ xem).",
  gymDescription: "Nhận/từ chối yêu cầu, gán PT, xác nhận hoàn tất buổi tập.",
};

const bookingStatusLabels: Record<BookingStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_GYM: "Chờ gym xác nhận",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Gym từ chối",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
  COMPLETED: "Hoàn thành",
};

const actionSuccessLabels: Record<BookingAction, string> = {
  checkout: "Đã gửi yêu cầu — vui lòng thanh toán nếu có phí",
  cancel: "Đã hủy lịch đặt",
  refund: "Đã gửi yêu cầu hoàn tiền",
  checkIn: "Đã check-in",
  accept: "Đã nhận lịch đặt",
  reject: "Đã từ chối lịch đặt",
  noShow: "Đã đánh dấu vắng mặt",
  complete: "Đã xác nhận hoàn tất buổi tập",
};

function dateTimeText(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);
function statusVariant(status?: BookingStatus): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED" || status === "CANCELLED" || status === "NO_SHOW") return "destructive";
  if (status === "CONFIRMED") return "info";
  if (status === "PENDING_PAYMENT" || status === "PENDING_GYM") return "warning";
  return "default";
}
function itemName(booking: Booking) {
  return booking.serviceName ?? booking.packageName ?? "Dịch vụ không tên";
}

export function BookingWorkspacePage({ scope }: { scope: BookingScope }) {
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const query = useBookings(scope, { status: status || undefined, page, size: 10, sort: ["id,desc"] });
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:p-7">
        <div className="absolute -right-10 -top-16 size-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
            <h1 className="text-3xl font-black tracking-tight">{scopeTitles[`${scope}Title`] ?? "Đặt lịch"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{scopeTitles[`${scope}Description`] ?? ""}</p>
          </div>
          {scope === "customer" && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />Tạo lịch đặt
            </Button>
          )}
        </div>
      </section>

      {/* C-12 + C-2: khách theo dõi hoàn tiền + danh sách chờ ngay trong workspace */}
      {scope === "customer" && <RefundStatusSection />}
      {scope === "customer" && <WaitlistSection />}

      <section className="mb-5 grid gap-3 rounded-2xl border border-border bg-card/80 p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Trạng thái</span>
          <Select value={status} onValueChange={(v) => { setStatus(v as BookingStatus | ""); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả trạng thái</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{bookingStatusLabels[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {query.isLoading ? <LoadingSkeleton /> : query.isError ? (
        <EmptyState title="Không thể tải dữ liệu" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có lịch đặt" description={scope === "customer" ? "Bạn chưa có lịch đặt nào. Hãy tạo lịch đặt mới để bắt đầu." : "Chưa có lịch đặt nào ở trạng thái này."} />
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
                  <h2 className="mt-1 text-lg font-black group-hover:text-accent">{itemName(booking)}</h2>
                </div>
                <Badge variant={statusVariant(booking.status)}>
                  {bookingStatusLabels[booking.status] ?? booking.status}
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent" />{dateTimeText(booking.startAt)}</span>
                <span className="flex items-center gap-2"><UserRound className="size-4 text-primary" />{scope === "customer" ? (booking.ptDisplayName ?? "Chưa gán PT") : booking.customerUsername}</span>
                <span className="flex items-center gap-2"><MapPin className="size-4 text-blue-500" />{booking.branchName ?? booking.gymName}</span>
                <strong className="text-foreground">{money(booking.totalAmount)}</strong>
              </div>
            </button>
          ))}
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-bold">{page + 1} / {query.data?.totalPages}</span>
          <Button variant="outline" size="icon-sm" disabled={query.data?.last} onClick={() => setPage((v) => v + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <BookingDetailDialog
        booking={selected}
        scope={scope}
        onClose={() => setSelected(null)}
        onPay={(id) => { setSelected(null); setPayingId(id); }}
      />
      {scope === "customer" && (
        <CreateBookingDialog
          open={creating}
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
      toast({ type: "warning", title: "Nhập lý do tranh chấp" });
      return;
    }
    try {
      await openDispute.mutateAsync({ bookingId, reason: disputeReason.trim() });
      toast({ type: "success", title: "Đã mở tranh chấp", description: "Điều phối viên sẽ xử lý; tiền (nếu có) được tạm giữ." });
      setDisputeReason(null);
      onClose();
    } catch (e) {
      toast({ type: "error", title: "Không mở được tranh chấp", description: toErrorMessage(e) });
    }
  }

  const bookingId = booking.id;
  const status = booking.status;
  const actions: Array<{ action: BookingAction; label: string; requireMessage?: boolean }> = [];
  const checkedIn = !!booking.checkedInAt;
  if (scope === "customer") {
    if (status === "DRAFT") actions.push({ action: "checkout", label: "Gửi yêu cầu & thanh toán" });
    if (status === "CONFIRMED" && !checkedIn) actions.push({ action: "checkIn", label: "Check-in" });
    if (["DRAFT", "PENDING_PAYMENT", "PENDING_GYM", "CONFIRMED"].includes(status)) {
      actions.push({ action: "cancel", label: "Hủy lịch" });
    }
    if (["REJECTED", "CANCELLED", "NO_SHOW"].includes(status)) {
      actions.push({ action: "refund", label: "Yêu cầu hoàn tiền", requireMessage: true });
    }
  }
  if (scope === "pt" && status === "CONFIRMED" && !checkedIn) {
    actions.push({ action: "checkIn", label: "Check-in cho khách" });
  }
  if (scope === "gym") {
    if (status === "PENDING_GYM") {
      actions.push({ action: "accept", label: "Nhận lịch" });
      actions.push({ action: "reject", label: "Từ chối", requireMessage: true });
    }
    if (status === "CONFIRMED") {
      if (!checkedIn) actions.push({ action: "checkIn", label: "Check-in cho khách" });
      actions.push({ action: "complete", label: "Hoàn tất buổi tập" });
      actions.push({ action: "noShow", label: "Khách vắng mặt" });
      actions.push({ action: "cancel", label: "Hủy lịch", requireMessage: true });
    }
  }

  async function run() {
    if (!confirming || !bookingId) return;
    if (confirming.requireMessage && !confirming.message?.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập lý do" });
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
      toast({ type: "success", title: actionSuccessLabels[confirming.action] ?? "Thao tác thành công" });
      const done = confirming.action;
      setConfirming(null);
      onClose();
      // Sau checkout có phí -> mở QR thanh toán ngay.
      if (done === "checkout" && (booking?.payableAmount ?? 0) > 0) onPay(bookingId);
    } catch (error) {
      toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(error) });
    }
  }

  return (
    <Dialog open title="Chi tiết lịch đặt" onClose={onClose}>
      <div className="rounded-2xl bg-muted/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">{itemName(booking)}</h3>
          <Badge variant={statusVariant(status)}>{bookingStatusLabels[status] ?? status}</Badge>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Khách hàng" value={booking.customerUsername} />
          <Info label="Huấn luyện viên" value={booking.ptDisplayName ?? "Chưa gán"} />
          <Info label="Địa điểm" value={[booking.gymName, booking.branchName].filter(Boolean).join(" · ")} />
          <Info label="Lịch tập" value={`${dateTimeText(booking.startAt)} → ${dateTimeText(booking.endAt)}`} />
          <Info label="Tổng tiền" value={booking.customerPackageId ? "Thuộc gói đã mua" : money(booking.totalAmount)} />
          <Info label="Check-in" value={booking.checkedInAt ? dateTimeText(booking.checkedInAt) : "Chưa check-in"} />
        </dl>
        {/* C-7: breakdown giá — khách thấy đúng số phải trả (khớp QR) */}
        <PriceBreakdown booking={booking} />
        {booking.lateCancellation && (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
            Hủy muộn — theo chính sách, một phần phí có thể không được hoàn lại.
          </p>
        )}
        {booking.statusReason && (
          <p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">{booking.statusReason}</p>
        )}
        {booking.customerNote && (
          <p className="mt-2 rounded-xl border border-border bg-card p-3 text-sm">{booking.customerNote}</p>
        )}
        {/* C-11 + C-6: timeline trạng thái + ghi chú buổi tập */}
        <BookingTimeline bookingId={booking.id} scope={scope} />
        <SessionNotesSection booking={booking} scope={scope} />
      </div>

      {scope === "customer" && status === "PENDING_PAYMENT" && (
        <Button className="mt-4 w-full" variant="outline" onClick={() => bookingId && onPay(bookingId)}>
          <QrCode className="size-4" />Xem mã QR thanh toán
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
            <Button variant="outline" onClick={() => setRescheduling(true)}>Dời lịch</Button>
          )}
          {/* C-6 (UC-050): gym hiệu chỉnh bản ghi hoàn tất/vắng mặt */}
          {scope === "gym" && ["COMPLETED", "NO_SHOW"].includes(status) && (
            <Button variant="outline" onClick={() => setCorrecting(true)}>Hiệu chỉnh điểm danh</Button>
          )}
        </div>
      )}

      {/* C-5 (UC-039): gym đổi PT cho booking đã nhận */}
      {scope === "gym" && status === "CONFIRMED" && (
        <div className="mt-3 flex items-center gap-2">
          <select
            value={reassignPtId}
            onChange={(e) => setReassignPtId(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="">— Đổi PT phụ trách —</option>
            {activePts.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName ?? p.username}</option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={!reassignPtId || reassign.isPending}
            onClick={async () => {
              try {
                await reassign.mutateAsync({ id: booking.id, ptId: Number(reassignPtId) });
                toast({ type: "success", title: "Đã đổi PT phụ trách" });
                setReassignPtId("");
                onClose();
              } catch (e) {
                toast({ type: "error", title: "Đổi PT thất bại", description: toErrorMessage(e) });
              }
            }}
          >
            Gán PT
          </Button>
        </div>
      )}

      {canDispute && disputeReason === null && (
        <button
          type="button"
          onClick={() => setDisputeReason("")}
          className="mt-3 text-sm font-semibold text-destructive hover:underline"
        >
          Mở tranh chấp / khiếu nại
        </button>
      )}

      {disputeReason !== null && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-black">Mở tranh chấp cho booking #{bookingId}</p>
          <Textarea
            className="mt-3"
            maxLength={1000}
            placeholder="Mô tả vấn đề (dịch vụ, thanh toán, điểm danh...)"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button variant="destructive" disabled={openDispute.isPending} onClick={() => void submitDispute()}>
              {openDispute.isPending ? "Đang gửi..." : "Gửi tranh chấp"}
            </Button>
            <Button variant="outline" onClick={() => setDisputeReason(null)}>Hủy</Button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-black">{confirming.label} — bạn chắc chắn?</p>
          {/* C-5 (UC-039): chọn PT phụ trách ngay khi nhận lịch */}
          {confirming.action === "accept" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                PT phụ trách {booking.ptDisplayName ? `(khách đề xuất: ${booking.ptDisplayName})` : "(không bắt buộc)"}
              </label>
              <select
                value={acceptPtId}
                onChange={(e) => setAcceptPtId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground"
              >
                <option value="">— Giữ nguyên lựa chọn của khách —</option>
                {activePts.map((p) => (
                  <option key={p.id} value={p.id}>{p.displayName ?? p.username}</option>
                ))}
              </select>
            </div>
          )}
          {(confirming.requireMessage || ["cancel", "reject", "refund"].includes(confirming.action)) && (
            <Textarea
              className="mt-3"
              maxLength={500}
              placeholder={confirming.requireMessage ? "Lý do (bắt buộc)" : "Lý do (không bắt buộc)"}
              value={confirming.message ?? ""}
              onChange={(e) => setConfirming({ ...confirming, message: e.target.value })}
            />
          )}
          <div className="mt-3 flex gap-2">
            <Button disabled={action.isPending} onClick={() => void run()}>
              {action.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(null)}>Hủy</Button>
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
              toast({ type: "success", title: "Đã dời lịch thành công" });
              setRescheduling(false);
              onClose();
            } catch (e) {
              toast({ type: "error", title: "Dời lịch thất bại", description: toErrorMessage(e) });
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

/** UC-052: hiển thị VietQR để khách chuyển khoản; Casso tự đối soát (UC-053). */
function PaymentDialog({ bookingId, onClose }: { bookingId: number | null; onClose: () => void }) {
  const query = useBookingPayment(bookingId ?? 0, bookingId !== null);
  if (bookingId === null) return null;
  const order = query.data;

  return (
    <Dialog open title="Thanh toán VietQR" onClose={onClose}>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError || !order ? (
        <EmptyState title="Không tải được đơn thanh toán" description={toErrorMessage(query.error)} />
      ) : (
        <div className="grid gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Quét mã bằng app ngân hàng và giữ nguyên nội dung chuyển khoản
            <strong className="mx-1 text-foreground">{order.refCode}</strong>
            để hệ thống tự đối soát.
          </p>
          {order.qrContent && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.qrContent} alt="VietQR" className="mx-auto w-64 max-w-full rounded-xl border border-border" />
          )}
          <div className="grid gap-1 text-sm">
            <span>Số tiền: <strong>{money(order.amount)}</strong></span>
            <span>Trạng thái: <strong>{order.status}</strong></span>
            {order.expiresAt && <span className="text-muted-foreground">Hết hạn: {dateTimeText(order.expiresAt)}</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Sau khi chuyển khoản, trạng thái sẽ tự cập nhật trong vài phút. Bạn có thể đóng cửa sổ này.
          </p>
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
function CreateBookingDialog({ open, onClose, onCheckedOut }: {
  open: boolean;
  onClose: () => void;
  onCheckedOut: (bookingId: number, payable: number) => void;
}) {
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
      toast({ type: "success", title: "Đã vào danh sách chờ", description: "Xem tại mục 'Danh sách chờ của tôi'." });
      setWaitlistOffer(null);
    },
    onError: (e) => toast({ type: "error", title: "Không vào được danh sách chờ", description: toErrorMessage(e) }),
  });
  const loyalty = useQuery({ queryKey: ["loyalty", "balance-mini"], queryFn: () => loyaltyService.balance(), enabled: open });

  const form = useForm<z.infer<typeof createBookingSchema>>({
    resolver: zodResolver(createBookingSchema),
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
    <Dialog open={open} title="Tạo lịch đặt" onClose={onClose}>
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
                toast({ type: "warning", title: "Không áp được voucher", description: toErrorMessage(err) });
              }
            } else if (values.mode === "new" && Number(pointsToUse) > 0) {
              try {
                await loyaltyService.apply(booking.id, Number(pointsToUse));
              } catch (err) {
                toast({ type: "warning", title: "Không dùng được điểm", description: toErrorMessage(err) });
              }
            }
            // UC-035: checkout ngay sau khi tạo nháp — BE validate đủ điều kiện + chốt giá.
            const checked = await checkoutAction.mutateAsync({ id: booking.id, action: "checkout" });
            const payable = (checked as Booking).payableAmount ?? 0;
            toast({
              type: "success",
              title: payable > 0 ? "Đã tạo lịch — vui lòng thanh toán VietQR" : "Đã gửi yêu cầu cho phòng gym",
            });
            form.reset();
            onCheckedOut(booking.id, payable);
          } catch (error) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(error) });
            // C-2 (UC-044): slot kín (409) -> mời vào danh sách chờ với đúng lựa chọn hiện tại.
            const status = (error as { status?: number })?.status;
            if (status === 409 && values.mode === "new" && values.itemId) {
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
          <FieldShell label="Hình thức">
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
                    <SelectItem value="new">Đặt & thanh toán mới</SelectItem>
                    <SelectItem value="package" disabled={!usablePackages.length}>
                      Dùng buổi từ gói đã mua{usablePackages.length ? ` (${usablePackages.length})` : " (không có)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FieldShell>
        </div>

        {mode === "package" ? (
          <div className="sm:col-span-2">
            <FieldShell label="Gói đã mua" error={form.formState.errors.customerPackageId}>
              <Controller
                control={form.control}
                name="customerPackageId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => { field.onChange(Number(v)); form.setValue("ptId", undefined); form.setValue("branchId", undefined); }}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn gói" /></SelectTrigger>
                    <SelectContent>
                      {usablePackages.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.packageName} · {p.gymName} · còn {p.sessionsRemaining}/{p.sessionsTotal} buổi
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
              <FieldShell label="Phòng gym" error={form.formState.errors.gymId}>
                <Controller
                  control={form.control}
                  name="gymId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => { field.onChange(Number(v)); form.setValue("itemId", 0); form.setValue("ptId", undefined); form.setValue("branchId", undefined); }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={gyms.isFetching ? "Đang tải..." : "Chọn phòng gym"} />
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

            <FieldShell label="Loại" error={form.formState.errors.itemType}>
              <Controller
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("itemId", 0); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Dịch vụ buổi lẻ</SelectItem>
                      <SelectItem value="package">Gói tập</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldShell>

            <FieldShell label={itemType === "service" ? "Dịch vụ" : "Gói tập"} error={form.formState.errors.itemId}>
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
                      <SelectValue placeholder={!gymId ? "Chọn gym trước" : (services.isFetching || packages.isFetching) ? "Đang tải..." : catalogItems.length ? "Chọn" : "Gym chưa công bố mục nào"} />
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

        <FieldShell label="Chi nhánh (tùy chọn)" error={form.formState.errors.branchId}>
          <Controller
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                disabled={!gymId || !branches.data?.length}
              >
                <SelectTrigger><SelectValue placeholder="Không chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn</SelectItem>
                  {branches.data?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>

        <FieldShell label="Huấn luyện viên (tùy chọn)" error={form.formState.errors.ptId}>
          <Controller
            control={form.control}
            name="ptId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                disabled={!gymId || !pts.data?.content?.length}
              >
                <SelectTrigger><SelectValue placeholder="Gym tự phân công" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Gym tự phân công</SelectItem>
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

        <FieldShell label="Ngày tập" error={form.formState.errors.bookingDate}>
          <Controller
            control={form.control}
            name="bookingDate"
            render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
          />
        </FieldShell>
        <FieldShell label="Giờ bắt đầu" error={form.formState.errors.startTime}>
          <Input type="time" {...form.register("startTime")} />
        </FieldShell>
        <FieldShell label="Giờ kết thúc" error={form.formState.errors.endTime}>
          <Input type="time" {...form.register("endTime")} />
        </FieldShell>

        {mode === "new" && (
          <>
            <FieldShell label="Mã giảm giá (tùy chọn)">
              <Input value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); if (e.target.value) setPointsToUse(""); }} placeholder="VD: SALE10" />
            </FieldShell>
            <FieldShell label={`Dùng điểm (còn ${loyalty.data?.pointsBalance ?? 0})`}>
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
          <FieldShell label="Ghi chú" error={form.formState.errors.note}>
            <Textarea {...form.register("note")} placeholder="Mục tiêu, yêu cầu đặc biệt..." />
          </FieldShell>
        </div>

        {/* B-31: kết quả pre-check khả dụng cho khung giờ đã chọn */}
        {precheckEnabled && precheck.data && (
          precheck.data.available ? (
            <p className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              ✓ Khung giờ này còn trống — có thể đặt.
            </p>
          ) : (
            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <p className="font-semibold">Khung giờ này không khả dụng:</p>
              <ul className="mt-1 list-inside list-disc">
                {precheck.data.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )
        )}

        {waitlistOffer && (
          <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-800">Khung giờ đã kín — vào danh sách chờ?</p>
            <p className="mt-1 text-xs text-amber-700">
              Khi có chỗ trống, phòng gym sẽ ưu tiên liên hệ theo thứ tự chờ.
            </p>
            <div className="mt-2 flex gap-2">
              <Button type="button" disabled={joinWaitlist.isPending} onClick={() => joinWaitlist.mutate()}>
                {joinWaitlist.isPending ? "Đang xử lý..." : "Vào danh sách chờ"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setWaitlistOffer(null)}>Bỏ qua</Button>
            </div>
          </div>
        )}

        <Button className="sm:col-span-2" disabled={create.isPending || checkoutAction.isPending}>
          <CalendarCheck2 className="size-4" />
          {create.isPending || checkoutAction.isPending ? "Đang xử lý..." : "Đặt lịch & thanh toán"}
        </Button>
      </form>
    </Dialog>
  );
}
