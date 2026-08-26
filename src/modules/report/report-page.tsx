"use client";

import { formatCurrency } from "@/utils/format.util";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService, type OperationalReport } from "@/services/report.service";
import { PageHeader } from "@/shared/components/common/page-header";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";
import { downloadCsv } from "@/shared/utils/csv.util";
import { Download } from "lucide-react";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { useTranslations } from "next-intl";
import { ReportBarChart } from "./report-charts";

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

/* Nhãn trạng thái vé dùng chung ở common.ticketStatus.* */

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

/** UC-076: màn báo cáo vận hành & tài chính (admin/finance toàn nền tảng, hoặc gym). */
export function ReportPage({ scope }: { scope: "admin" | "gym" }) {
  const t = useTranslations();
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
        title={t("reportPage.title")}
        description={t("reportPage.subtitle")}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("reportPage.fromDate")}
          <DatePicker value={from} onChange={(v) => setFrom(v ?? "")} className="w-44" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("reportPage.toDate")}
          <DatePicker value={to} onChange={(v) => setTo(v ?? "")} className="w-44" />
        </label>
        <Button onClick={() => setApplied({ from, to })}>{t("reportPage.view")}</Button>
        {/* E-12: xuất CSV báo cáo đang xem (client-side, BOM UTF-8 cho Excel) */}
        {r && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              downloadCsv(
                `bao-cao-${scope}-${applied.from}_${applied.to}`,
                [t("reportPage.metric"), t("common.table.value")],
                [
                  [t("reportPage.fromDate"), applied.from],
                  [t("reportPage.toDate"), applied.to],
                  [t("reportPage.totalBookings"), r.totalBookings],
                  ...Object.entries(r.bookingsByStatus ?? {}).map(
                    ([k, v]) => [t("reportPage.bookingPrefix", { status: t(`common.ticketStatus.${k}` as never) }), v] as [string, number],
                  ),
                  [t("reportPage.collected"), r.grossHeld],
                  [t("reportPage.released"), r.releasedNet],
                  [t("reportPage.commission"), r.commission],
                  [t("reportPage.refunded"), r.refunded],
                  [t("reportPage.totalDisputes"), r.totalDisputes],
                  ...Object.entries(r.disputesByStatus ?? {}).map(
                    ([k, v]) => [t("reportPage.disputePrefix", { status: t(`dispute.status.${k}` as never) }), v] as [string, number],
                  ),
                ],
              )
            }
          >
            <Download className="size-4" /> {t("reportPage.exportCsv")}
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError || !r ? (
        <EmptyState title={t("reportPage.loadError")} description={toErrorMessage(query.error)} />
      ) : (
        <ReportBody report={r} showWallet={scope === "gym"} />
      )}
    </div>
  );
}

function ReportBody({ report: r, showWallet }: { report: OperationalReport; showWallet: boolean }) {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* String(undefined) in ra chữ "undefined" ngay trên thẻ số liệu khi BE
            trả thiếu field. money() và BreakdownTable đã chống bằng ?? — hai ô
            đếm này thì chưa. */}
        <Stat label={t("reportPage.totalBookings")} value={String(r.totalBookings ?? 0)} />
        <Stat label={t("reportPage.collected")} value={money(r.grossHeld)} />
        <Stat label={t("reportPage.released")} value={money(r.releasedNet)} />
        <Stat label={t("reportPage.commission")} value={money(r.commission)} />
        <Stat label={t("reportPage.refunded")} value={money(r.refunded)} />
        <Stat label={t("reportPage.totalDisputes")} value={String(r.totalDisputes ?? 0)} />
      </div>

      {showWallet && (
        <div>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">{t("reportPage.walletNow")}</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("reportPage.held")} value={money(r.walletHeld)} />
            <Stat label={t("wallet.pending")} value={money(r.walletPending)} />
            <Stat label={t("wallet.available")} value={money(r.walletAvailable)} />
            <Stat label={t("reportPage.frozen")} value={money(r.walletFrozen)} />
          </div>
        </div>
      )}

      {/*
        Chart cho màn báo cáo: bảng số cho biết giá trị, nhưng không cho biết
        TƯƠNG QUAN — nhìn cột mới thấy ngay vé huỷ đang chiếm bao nhiêu so với vé
        dùng hết, hay hoa hồng nhỏ thế nào bên cạnh tiền đã thu. Vẫn in số nguyên
        bên phải mỗi cột nên không mất gì so với bảng cũ.
      */}
      <ReportBarChart
        title={t("reportPage.cashFlow")}
        format={money}
        data={[
          { key: "grossHeld", label: t("reportPage.collected"), value: r.grossHeld ?? 0 },
          { key: "releasedNet", label: t("reportPage.released"), value: r.releasedNet ?? 0 },
          { key: "commission", label: t("reportPage.commission"), value: r.commission ?? 0 },
          { key: "refunded", label: t("reportPage.refunded"), value: r.refunded ?? 0 },
        ]}
      />

      <ReportBarChart
        title={t("reportPage.bookingsByStatus")}
        data={Object.entries(r.bookingsByStatus ?? {}).map(([key, value]) => ({
          key,
          label: t(`common.ticketStatus.${key}` as never),
          value,
        }))}
      />

      <ReportBarChart
        title={t("reportPage.disputesByStatus")}
        data={Object.entries(r.disputesByStatus ?? {}).map(([key, value]) => ({
          key,
          label: key,
          value,
        }))}
      />
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
