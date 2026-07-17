"use client";

import { formatCurrency } from "@/utils/format.util";
// Gói 2.E (audit 2026-07-17): các mảng BE-đủ-FE-thiếu của luồng booking —
// C-7 breakdown giá, C-11 timeline, C-6 session notes + hiệu chỉnh điểm danh,
// C-4 dời lịch, C-12 trạng thái hoàn tiền, C-2 danh sách chờ.

import { useState } from "react";
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

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);
function dateTimeText(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

/** C-7 (UC-034): khách phải thấy đúng số QR — tổng → giảm → điểm → PHẢI TRẢ. */
export function PriceBreakdown({ booking }: { booking: Booking }) {
  if (booking.customerPackageId) {
    return <p className="mt-3 text-sm font-semibold text-emerald-600">Buổi tập thuộc gói đã mua — không thu thêm phí.</p>;
  }
  const hasDiscount = (booking.discountAmount ?? 0) > 0 || (booking.loyaltyPointsUsed ?? 0) > 0;
  if (!hasDiscount && booking.payableAmount == null) return null;
  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Tổng tiền dịch vụ</span><span>{money(booking.totalAmount)}</span>
      </div>
      {(booking.discountAmount ?? 0) > 0 && (
        <div className="flex justify-between text-emerald-600">
          <span>Giảm giá{booking.voucherCode ? ` (mã ${booking.voucherCode})` : ""}</span>
          <span>-{money(booking.discountAmount)}</span>
        </div>
      )}
      {(booking.loyaltyPointsUsed ?? 0) > 0 && (
        <div className="flex justify-between text-emerald-600">
          <span>Điểm thưởng đã dùng</span><span>{booking.loyaltyPointsUsed} điểm</span>
        </div>
      )}
      <div className="mt-1 flex justify-between border-t border-border pt-1 font-black text-foreground">
        <span>Phải trả</span><span>{money(booking.payableAmount ?? booking.totalAmount)}</span>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Bản nháp", PENDING_PAYMENT: "Chờ thanh toán", PENDING_GYM: "Chờ gym xác nhận",
  CONFIRMED: "Đã xác nhận", REJECTED: "Gym từ chối", CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt", COMPLETED: "Hoàn thành",
};

/** C-11 (UC-040): timeline trạng thái — endpoint 4 vai có sẵn, trước đây 0 UI. */
export function BookingTimeline({ bookingId, scope }: { bookingId: number; scope: BookingScope }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: [...bookingKeys.detail(bookingId), "history", scope],
    queryFn: () => (scope === "gym" ? bookingService.getGymHistory(bookingId) : bookingService.getHistory(bookingId)),
    enabled: open && scope !== "pt", // BE không có endpoint history cho PT
  });

  if (scope === "pt") return null;

  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <Clock3 className="size-4" /> {open ? "Ẩn lịch sử trạng thái" : "Xem lịch sử trạng thái"}
      </button>
      {open && (
        query.isLoading ? (
          <div className="mt-2 h-10 animate-pulse rounded-xl bg-muted" />
        ) : query.isError ? (
          <p className="mt-2 text-xs text-red-500">{toErrorMessage(query.error)}</p>
        ) : !(query.data ?? []).length ? (
          <p className="mt-2 text-xs text-muted-foreground">Chưa có lịch sử.</p>
        ) : (
          <ul className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {(query.data ?? []).map((h, i) => (
              <li key={i} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
                <span className="font-semibold text-foreground">
                  {STATUS_LABEL[h.fromStatus] ?? h.fromStatus} → {STATUS_LABEL[h.toStatus] ?? h.toStatus}
                </span>
                <span className="text-muted-foreground"> · {dateTimeText(h.changedAt)}{h.changedBy ? ` · ${h.changedBy}` : ""}</span>
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
      toast({ type: "success", title: "Đã lưu ghi chú buổi tập" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  if (!canView) return null;

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <NotebookPen className="size-4" /> {open ? "Ẩn ghi chú buổi tập" : "Ghi chú buổi tập"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {query.isLoading ? (
            <div className="h-10 animate-pulse rounded-xl bg-muted" />
          ) : query.isError ? (
            <p className="text-xs text-red-500">{toErrorMessage(query.error)}</p>
          ) : !(query.data ?? []).length ? (
            <p className="text-xs text-muted-foreground">Chưa có ghi chú nào.</p>
          ) : (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {(query.data ?? []).map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                  <p className="text-foreground">{n.note}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {n.author ? `${n.author} · ` : ""}{dateTimeText(n.createdAt)}
                    {n.evidenceUrl && (
                      <a href={n.evidenceUrl} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline">tệp đính kèm</a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {canAdd && (
            <div className="flex gap-2">
              <Input value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)}
                placeholder="Nội dung buổi tập, tiến độ của khách..." className="text-sm" />
              <Button onClick={() => add.mutate()} disabled={!note.trim() || add.isPending}
                className="h-9 shrink-0 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90 text-white">
                {add.isPending && <Loader2 className="size-3.5 animate-spin" />} Thêm
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
  const [start, setStart] = useState(booking.startAt?.slice(0, 16) ?? "");
  const [end, setEnd] = useState(booking.endAt?.slice(0, 16) ?? "");
  const invalid = !start || !end || start >= end;

  return (
    <Dialog open title={`Dời lịch booking #${booking.id}`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Khung giờ mới phải nằm trong giờ mở cửa/lịch rảnh PT — hệ thống sẽ kiểm tra và báo nếu trùng.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Bắt đầu</label>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Kết thúc</label>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      {invalid && (start || end) && <p className="mt-2 text-xs text-red-500">Giờ bắt đầu phải trước giờ kết thúc.</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button disabled={invalid || pending} onClick={() => onSubmit(start + ":00", end + ":00")}
          className="gap-2 bg-primary hover:bg-primary/90 text-white">
          {pending && <Loader2 className="size-4 animate-spin" />} Dời lịch
        </Button>
      </div>
    </Dialog>
  );
}

const REFUND_LABEL: Record<RefundStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  EXECUTED: "Đã hoàn tiền",
};
const REFUND_VARIANT: Record<RefundStatus, "default" | "success" | "destructive" | "warning"> = {
  PENDING: "warning", APPROVED: "success", REJECTED: "destructive", EXECUTED: "success",
};

/** C-12/D-6 (UC-055): khách theo dõi trạng thái yêu cầu hoàn tiền — trước đây "mù". */
export function RefundStatusSection() {
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
        {open ? "▾" : "▸"} Yêu cầu hoàn tiền của tôi
      </button>
      {open && (
        query.isLoading ? (
          <div className="mt-3 h-10 animate-pulse rounded-xl bg-muted" />
        ) : query.isError ? (
          <p className="mt-3 text-xs text-red-500">{toErrorMessage(query.error)}</p>
        ) : !items.length ? (
          <p className="mt-3 text-sm text-muted-foreground">Bạn chưa có yêu cầu hoàn tiền nào.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Booking #{r.bookingId} · {money(r.amount)}</p>
                  {r.decisionNote && <p className="truncate text-xs text-muted-foreground">{r.decisionNote}</p>}
                </div>
                <Badge variant={REFUND_VARIANT[r.status]}>{REFUND_LABEL[r.status]}</Badge>
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
      toast({ type: "success", title: "Đã rời danh sách chờ" });
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) }),
  });

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/80 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="text-sm font-black uppercase tracking-wide text-muted-foreground hover:text-foreground">
        {open ? "▾" : "▸"} Danh sách chờ của tôi
      </button>
      {open && (
        query.isLoading ? (
          <div className="mt-3 h-10 animate-pulse rounded-xl bg-muted" />
        ) : query.isError ? (
          <p className="mt-3 text-xs text-red-500">{toErrorMessage(query.error)}</p>
        ) : !(query.data ?? []).length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Bạn chưa chờ slot nào. Khi khung giờ mong muốn đã kín, dùng nút &quot;Vào danh sách chờ&quot; trong form đặt lịch.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(query.data ?? []).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{w.serviceName ?? w.packageName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    Mong muốn: {dateTimeText(w.preferredStart)}{w.note ? ` · ${w.note}` : ""}
                  </p>
                </div>
                <button onClick={() => w.id != null && leave.mutate(w.id)} disabled={leave.isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-600 shrink-0" aria-label="Rời danh sách chờ">
                  <Trash2 className="size-4" />
                </button>
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
  const { toast } = useToast();
  const client = useQueryClient();
  const [target, setTarget] = useState<BookingStatus>(booking.status === "NO_SHOW" ? "COMPLETED" : "NO_SHOW");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => bookingService.correctAttendance(booking.id, { status: target, reason: reason.trim() }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: bookingKeys.all });
      toast({ type: "success", title: "Đã hiệu chỉnh bản ghi" });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={`Hiệu chỉnh điểm danh — booking #${booking.id}`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Dùng khi bản ghi hoàn tất/vắng mặt bị sai (UC-050). Bị chặn nếu tiền đã giải ngân/hoàn.
      </p>
      <div className="mt-3 space-y-3">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as BookingStatus)}
          className="h-10 w-full rounded-lg border border-border bg-card px-2.5 text-sm text-foreground"
        >
          <option value="COMPLETED">Chuyển thành Hoàn tất</option>
          <option value="NO_SHOW">Chuyển thành Vắng mặt</option>
        </select>
        <Textarea value={reason} maxLength={500} rows={3} onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do hiệu chỉnh (bắt buộc, ghi vào audit)..." />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => mutation.mutate()}
            disabled={!reason.trim() || target === booking.status || mutation.isPending}
            className="gap-2 bg-primary hover:bg-primary/90 text-white">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />} Xác nhận
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
