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
import { Table, TableBody, TableCell, TableRow } from "@/shared/components/ui/table";

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

/* Nhãn trạng thái booking dùng chung ở common.bookingStatus.* */

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
                    ([k, v]) => [t("reportPage.bookingPrefix", { status: t(`common.bookingStatus.${k}` as never) }), v] as [string, number],
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
        <Stat label={t("reportPage.totalBookings")} value={String(r.totalBookings)} />
        <Stat label={t("reportPage.collected")} value={money(r.grossHeld)} />
        <Stat label={t("reportPage.released")} value={money(r.releasedNet)} />
        <Stat label={t("reportPage.commission")} value={money(r.commission)} />
        <Stat label={t("reportPage.refunded")} value={money(r.refunded)} />
        <Stat label={t("reportPage.totalDisputes")} value={String(r.totalDisputes)} />
      </div>

      {showWallet && (
        <div>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">{t("reportPage.walletNow")}</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("reportPage.held")} value={money(r.walletHeld)} />
            <Stat label={t("withdrawal.pending")} value={money(r.walletPending)} />
            <Stat label={t("withdrawal.available")} value={money(r.walletAvailable)} />
            <Stat label={t("reportPage.frozen")} value={money(r.walletFrozen)} />
          </div>
        </div>
      )}

      <BreakdownTable title={t("reportPage.bookingsByStatus")} data={r.bookingsByStatus} labelPrefix="common.bookingStatus." />
      <BreakdownTable title={t("reportPage.disputesByStatus")} data={r.disputesByStatus} />
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

function BreakdownTable({ title, data, labelPrefix }: { title: string; data: Record<string, number>; labelPrefix?: "common.bookingStatus." | "dispute.status." }) {
  const t = useTranslations();
  const entries = Object.entries(data ?? {});
  if (!entries.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <Table>
        <TableBody>
          {entries.map(([k, v]) => (
            <TableRow key={k}>
              <TableCell className="py-2 text-muted-foreground">{labelPrefix ? t(`${labelPrefix}${k}` as never) : k}</TableCell>
              <TableCell className="py-2 text-right font-bold">{v}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
