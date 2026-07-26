"use client";

// P0-6 (audit 2026-07-17): thay trang mock (AdminBookingsPage/ecommerce-pages) bằng
// trang thật nối /api/admin/bookings — list/detail/timeline/confirm-payment/correct-attendance.

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { useTranslations } from "next-intl";
import { BOOKING_STATUS_ORDER } from "@/shared/utils/enum-label.util";
import { Pagination } from "@/shared/components/ui/pagination";
import { DataTable } from "@/shared/components/common/data-table";
import { useFormatters } from "@/i18n/use-formatters";

const PAGE_SIZE = 10;


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

/** `fromPackageLabel` truyền từ component vì helper thường không gọi được hook. */
function itemName(b: Booking, fromPackageLabel: string) {
  return b.serviceName ?? b.packageName ?? (b.customerPackageId ? fromPackageLabel : "—");
}

function BookingDetailDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const t = useTranslations();
  const fmt = useFormatters();
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
      toast({ type: "success", title: t("admin.bookings.heldConfirmed"), description: t("admin.bookings.heldConfirmedDesc") });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const correct = useMutation({
    mutationFn: () =>
      adminService.correctBookingAttendance(booking.id, { status: correctStatus, reason: reason.trim() }),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: t("admin.bookings.corrected") });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const canCorrect = booking.status === "COMPLETED" || booking.status === "NO_SHOW";

  return (
    <Dialog open title={`Booking #${booking.id}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <p className="text-muted-foreground">{t("admin.bookings.customer")}</p>
          <p className="text-foreground">{booking.customerUsername ?? "—"}</p>
          <p className="text-muted-foreground">{t("admin.bookings.gym")}</p>
          <p className="text-foreground">{booking.gymName ?? "—"}{booking.branchName ? ` — ${booking.branchName}` : ""}</p>
          <p className="text-muted-foreground">{t("admin.bookings.serviceOrPackage")}</p>
          <p className="text-foreground">{itemName(booking, t("admin.bookings.fromPackage"))}</p>
          <p className="text-muted-foreground">PT</p>
          <p className="text-foreground">{booking.ptDisplayName ?? "—"}</p>
          <p className="text-muted-foreground">{t("common.table.time")}</p>
          <p className="text-foreground">{fmt.dateTime(booking.startAt)} → {fmt.dateTime(booking.endAt)}</p>
          <p className="text-muted-foreground">Check-in</p>
          <p className="text-foreground">{fmt.dateTime(booking.checkedInAt)}</p>
          <p className="text-muted-foreground">{t("admin.bookings.payable")}</p>
          <p className="text-foreground">{booking.payableAmount != null ? formatCurrency(booking.payableAmount) : "—"}</p>
          <p className="text-muted-foreground">{t("common.table.status")}</p>
          <p><Badge variant={STATUS_VARIANT[booking.status]}>{t(`common.bookingStatus.${booking.status}`)}</Badge></p>
          {booking.statusReason && (
            <>
              <p className="text-muted-foreground">{t("common.table.reason")}</p>
              <p className="text-foreground">{booking.statusReason}</p>
            </>
          )}
        </div>

        <div>
          <p className="font-medium text-foreground mb-2">{t("admin.bookings.statusHistory")}</p>
          {history.isLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse" />
          ) : history.isError ? (
            <p className="text-xs text-destructive">{toErrorMessage(history.error)}</p>
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("admin.bookings.noHistory")}</p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(history.data ?? []).map((h, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="text-foreground">{h.fromStatus ? t(`common.bookingStatus.${h.fromStatus}`) : "—"} → {h.toStatus ? t(`common.bookingStatus.${h.toStatus}`) : "—"}</span>
                  {h.changedBy ? ` · ${h.changedBy}` : ""} · {fmt.dateTime(h.changedAt)}
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
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {confirmPayment.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("admin.bookings.confirmReceived")}
            </Button>
          )}
          {canCorrect && (
            <Button variant="outline" onClick={() => setCorrectOpen(true)}>
              {t("admin.bookings.correctAttendance")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>{t("common.actions.close")}</Button>
        </div>
      </div>

      <Dialog open={correctOpen} title={t("admin.bookings.correctDialogTitle")} onClose={() => setCorrectOpen(false)}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("admin.bookings.correctHint")}
          </p>
          <Select value={correctStatus} onValueChange={(v) => setCorrectStatus(v as "COMPLETED" | "NO_SHOW")}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">{t("admin.bookings.toCompleted")}</SelectItem>
              <SelectItem value="NO_SHOW">{t("admin.bookings.toNoShow")}</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t("admin.bookings.correctReasonPlaceholder")}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCorrectOpen(false)}>{t("common.actions.cancel")}</Button>
            <Button
              onClick={() => correct.mutate()}
              disabled={!reason.trim() || correctStatus === booking.status || correct.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {correct.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("admin.bookings.confirmCorrection")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog>
  );
}

export default function AdminBookingsRoute() {
  const t = useTranslations();
  const fmt = useFormatters();
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
        <h1 className="text-2xl font-bold text-foreground">{t("admin.bookings.title")}</h1>
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={t("common.filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("common.filters.allStatuses")}</SelectItem>
              {BOOKING_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{t(`common.bookingStatus.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <DataTable
          className="rounded-none"
          rows={bookings}
          rowKey={(b) => String(b.id)}
          loading={query.isLoading}
          error={query.isError}
          errorTitle={t("admin.bookings.loadError")}
          errorDescription={query.isError ? toErrorMessage(query.error) : undefined}
          onRetry={() => query.refetch()}
          emptyTitle={t("admin.bookings.empty")}
          onRowClick={(b) => setSelected(b)}
          columns={[
            { key: "id", header: t("common.table.code"), cell: (b) => `#${b.id}` },
            {
              key: "customer",
              header: t("admin.bookings.customer"),
              cell: (b) => b.customerUsername ?? "—",
            },
            {
              key: "gym",
              header: t("admin.bookings.gym"),
              hideBelow: "sm",
              cell: (b) => b.gymName ?? "—",
            },
            {
              key: "item",
              header: t("admin.bookings.serviceOrPackage"),
              hideBelow: "lg",
              cellClassName: "text-muted-foreground",
              cell: (b) => itemName(b, t("admin.bookings.fromPackage")),
            },
            {
              key: "start",
              header: t("admin.bookings.start"),
              hideBelow: "md",
              cellClassName: "text-xs text-muted-foreground",
              cell: (b) => fmt.dateTime(b.startAt),
            },
            {
              key: "payable",
              header: t("admin.bookings.payable"),
              align: "right",
              cell: (b) => (b.payableAmount != null ? formatCurrency(b.payableAmount) : "—"),
            },
            {
              key: "status",
              header: t("common.table.status"),
              cell: (b) => (
                <Badge variant={STATUS_VARIANT[b.status]}>
                  {t(`common.bookingStatus.${b.status}`)}
                </Badge>
              ),
            },
          ]}
        />

        <Pagination
          className="border-t border-border px-5 py-3"
          page={page}
          zeroBased
          totalPages={totalPages}
          totalItems={totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {selected && <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
