"use client";

import { formatCurrency } from "@/utils/format.util";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService, type OperationalReport } from "@/services/report.service";
import { PageHeader } from "@/shared/components/common/page-header";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";
import { downloadCsv } from "@/shared/utils/csv.util";
import { Download } from "lucide-react";

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

const bookingStatusLabels: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_GYM: "Chờ gym",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
  COMPLETED: "Hoàn tất",
};

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

/** UC-076: màn báo cáo vận hành & tài chính (admin/finance toàn nền tảng, hoặc gym). */
export function ReportPage({ scope }: { scope: "admin" | "gym" }) {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [applied, setApplied] = useState({ from: firstOfMonth(), to: today() });

  const query = useQuery({
    queryKey: ["report", scope, applied.from, applied.to],
    queryFn: () =>
      scope === "admin"
        ? reportService.platform(applied.from, applied.to)
        : reportService.gym(applied.from, applied.to),
  });
  const r = query.data;

  return (
    <div>
      <PageHeader
        title="Báo cáo vận hành"
        description="Thống kê đặt lịch, dòng tiền và tranh chấp theo khoảng thời gian (UC-076)."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Từ ngày
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Đến ngày
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </label>
        <Button onClick={() => setApplied({ from, to })}>Xem báo cáo</Button>
        {/* E-12: xuất CSV báo cáo đang xem (client-side, BOM UTF-8 cho Excel) */}
        {r && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              downloadCsv(
                `bao-cao-${scope}-${applied.from}_${applied.to}`,
                ["Chỉ số", "Giá trị"],
                [
                  ["Từ ngày", applied.from],
                  ["Đến ngày", applied.to],
                  ["Tổng booking", r.totalBookings],
                  ...Object.entries(r.bookingsByStatus ?? {}).map(
                    ([k, v]) => [`Booking ${bookingStatusLabels[k] ?? k}`, v] as [string, number],
                  ),
                  ["Tiền đã thu (giữ)", r.grossHeld],
                  ["Đã giải ngân (ròng)", r.releasedNet],
                  ["Hoa hồng nền tảng", r.commission],
                  ["Đã hoàn khách", r.refunded],
                  ["Tổng tranh chấp", r.totalDisputes],
                  ...Object.entries(r.disputesByStatus ?? {}).map(
                    ([k, v]) => [`Tranh chấp ${k}`, v] as [string, number],
                  ),
                ],
              )
            }
          >
            <Download className="size-4" /> Xuất CSV
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError || !r ? (
        <EmptyState title="Không tải được báo cáo" description={toErrorMessage(query.error)} />
      ) : (
        <ReportBody report={r} showWallet={scope === "gym"} />
      )}
    </div>
  );
}

function ReportBody({ report: r, showWallet }: { report: OperationalReport; showWallet: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tổng booking" value={String(r.totalBookings)} />
        <Stat label="Tiền đã thu (giữ)" value={money(r.grossHeld)} />
        <Stat label="Đã giải ngân (ròng)" value={money(r.releasedNet)} />
        <Stat label="Hoa hồng nền tảng" value={money(r.commission)} />
        <Stat label="Đã hoàn khách" value={money(r.refunded)} />
        <Stat label="Tổng tranh chấp" value={String(r.totalDisputes)} />
      </div>

      {showWallet && (
        <div>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Số dư ví hiện tại</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Đang giữ" value={money(r.walletHeld)} />
            <Stat label="Chờ giải ngân" value={money(r.walletPending)} />
            <Stat label="Khả dụng" value={money(r.walletAvailable)} />
            <Stat label="Đóng băng" value={money(r.walletFrozen)} />
          </div>
        </div>
      )}

      <BreakdownTable title="Booking theo trạng thái" data={r.bookingsByStatus} labels={bookingStatusLabels} />
      <BreakdownTable title="Tranh chấp theo trạng thái" data={r.disputesByStatus} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function BreakdownTable({ title, data, labels }: { title: string; data: Record<string, number>; labels?: Record<string, string> }) {
  const entries = Object.entries(data ?? {});
  if (!entries.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td className="py-2 text-muted-foreground">{labels?.[k] ?? k}</td>
              <td className="py-2 text-right font-bold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
