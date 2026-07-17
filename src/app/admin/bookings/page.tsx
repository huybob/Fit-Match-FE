"use client";

// P0-6 (audit 2026-07-17): thay trang mock (AdminBookingsPage/ecommerce-pages) bằng
// trang thật nối /api/admin/bookings — list/detail/timeline/confirm-payment/correct-attendance.

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import type { Booking, BookingStatus } from "@/types/Booking";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<BookingStatus, string> = {
  DRAFT: "Nháp",
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_GYM: "Chờ phòng tập",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
  COMPLETED: "Hoàn tất",
};

const STATUS_VARIANT: Record<BookingStatus, "default" | "success" | "destructive" | "warning"> = {
  DRAFT: "default",
  PENDING_PAYMENT: "warning",
  PENDING_GYM: "warning",
  CONFIRMED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
  COMPLETED: "success",
};

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

function itemName(b: Booking) {
  return b.serviceName ?? b.packageName ?? (b.customerPackageId ? "Buổi từ gói đã mua" : "—");
}

function BookingDetailDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { toast } = useToast();
  const client = useQueryClient();
  const [correctOpen, setCorrectOpen] = useState(false);
  const [correctStatus, setCorrectStatus] = useState<"COMPLETED" | "NO_SHOW">(
    booking.status === "NO_SHOW" ? "COMPLETED" : "NO_SHOW",
  );
  const [reason, setReason] = useState("");

  const history = useQuery({
    queryKey: ["admin", "bookings", booking.id, "history"],
    queryFn: () => adminService.getBookingHistory(booking.id),
  });

  const invalidate = () => client.invalidateQueries({ queryKey: ["admin", "bookings"] });

  const confirmPayment = useMutation({
    mutationFn: () => adminService.confirmBookingPayment(booking.id),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: "Đã xác nhận giữ tiền", description: "Booking chuyển sang Chờ phòng tập." });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  const correct = useMutation({
    mutationFn: () =>
      adminService.correctBookingAttendance(booking.id, { status: correctStatus, reason: reason.trim() }),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: "Đã hiệu chỉnh bản ghi" });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  const canCorrect = booking.status === "COMPLETED" || booking.status === "NO_SHOW";

  return (
    <Dialog open title={`Booking #${booking.id}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <p className="text-muted-foreground">Khách hàng</p>
          <p className="text-foreground">{booking.customerUsername ?? "—"}</p>
          <p className="text-muted-foreground">Phòng tập</p>
          <p className="text-foreground">{booking.gymName ?? "—"}{booking.branchName ? ` — ${booking.branchName}` : ""}</p>
          <p className="text-muted-foreground">Dịch vụ / Gói</p>
          <p className="text-foreground">{itemName(booking)}</p>
          <p className="text-muted-foreground">PT</p>
          <p className="text-foreground">{booking.ptDisplayName ?? "—"}</p>
          <p className="text-muted-foreground">Thời gian</p>
          <p className="text-foreground">{formatDateTime(booking.startAt)} → {formatDateTime(booking.endAt)}</p>
          <p className="text-muted-foreground">Check-in</p>
          <p className="text-foreground">{formatDateTime(booking.checkedInAt)}</p>
          <p className="text-muted-foreground">Phải trả</p>
          <p className="text-foreground">{booking.payableAmount != null ? formatCurrency(booking.payableAmount) : "—"}</p>
          <p className="text-muted-foreground">Trạng thái</p>
          <p><Badge variant={STATUS_VARIANT[booking.status]}>{STATUS_LABEL[booking.status]}</Badge></p>
          {booking.statusReason && (
            <>
              <p className="text-muted-foreground">Lý do</p>
              <p className="text-foreground">{booking.statusReason}</p>
            </>
          )}
        </div>

        <div>
          <p className="font-medium text-foreground mb-2">Lịch sử trạng thái</p>
          {history.isLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse" />
          ) : history.isError ? (
            <p className="text-xs text-red-500">{toErrorMessage(history.error)}</p>
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có lịch sử.</p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(history.data ?? []).map((h, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="text-foreground">{STATUS_LABEL[h.fromStatus] ?? h.fromStatus} → {STATUS_LABEL[h.toStatus] ?? h.toStatus}</span>
                  {h.changedBy ? ` · ${h.changedBy}` : ""} · {formatDateTime(h.changedAt)}
                  {h.reason ? ` — ${h.reason}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border">
          {booking.status === "PENDING_PAYMENT" && (
            <Button
              onClick={() => confirmPayment.mutate()}
              disabled={confirmPayment.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              {confirmPayment.isPending && <Loader2 className="size-4 animate-spin" />}
              Xác nhận đã nhận tiền (đối soát tay)
            </Button>
          )}
          {canCorrect && (
            <Button variant="outline" onClick={() => setCorrectOpen(true)}>
              Hiệu chỉnh điểm danh
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>

      <Dialog open={correctOpen} title="Hiệu chỉnh bản ghi hoàn tất/vắng mặt" onClose={() => setCorrectOpen(false)}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Chỉ dùng khi bản ghi sai (UC-050). Bị chặn nếu tiền đã giải ngân/hoàn.
          </p>
          <Select value={correctStatus} onValueChange={(v) => setCorrectStatus(v as "COMPLETED" | "NO_SHOW")}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Chuyển thành Hoàn tất</SelectItem>
              <SelectItem value="NO_SHOW">Chuyển thành Vắng mặt</SelectItem>
            </SelectContent>
          </Select>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Lý do hiệu chỉnh (bắt buộc, ghi vào audit log)..."
            className="w-full text-sm border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCorrectOpen(false)}>Hủy</Button>
            <Button
              onClick={() => correct.mutate()}
              disabled={!reason.trim() || correctStatus === booking.status || correct.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              {correct.isPending && <Loader2 className="size-4 animate-spin" />}
              Xác nhận
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog>
  );
}

export default function AdminBookingsRoute() {
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);

  const query = useQuery({
    queryKey: ["admin", "bookings", status, page],
    queryFn: () =>
      adminService.listBookings({
        status: (status || undefined) as BookingStatus | undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const bookings = query.data?.content ?? [];
  const totalElements = query.data?.totalElements ?? 0;
  const totalPages = query.data?.totalPages ?? 1;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">Quản lý booking</h1>
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả trạng thái</SelectItem>
              {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phòng tập</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dịch vụ / Gói</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bắt đầu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phải trả</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3">
                      <div className="h-8 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : query.isError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-red-500 text-sm">
                    {toErrorMessage(query.error)}
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    Không có booking nào
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-5 py-3 font-medium text-foreground">#{b.id}</td>
                    <td className="px-4 py-3 text-foreground">{b.customerUsername ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{b.gymName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{itemName(b)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(b.startAt)}</td>
                    <td className="px-4 py-3 text-foreground">
                      {b.payableAmount != null ? formatCurrency(b.payableAmount) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {totalElements > 0
              ? `Hiển thị ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalElements)} / ${totalElements.toLocaleString("vi-VN")} booking`
              : "Không có dữ liệu"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-3 text-xs gap-1"
              disabled={page === 0}
              onClick={() => setPage((v) => v - 1)}
            >
              <ChevronLeft className="size-3.5" /> Trước
            </Button>
            <Button
              variant="outline"
              className="h-8 px-3 text-xs gap-1"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((v) => v + 1)}
            >
              Sau <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {selected && <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
