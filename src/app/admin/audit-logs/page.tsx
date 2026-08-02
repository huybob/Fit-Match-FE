"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";
import { DateTimePicker } from "@/shared/components/ui/date-time-picker";
import { useTranslations } from "next-intl";
import { DataTable } from "@/shared/components/common/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { TableEllipsis } from "@/shared/components/ui/table";
import { useFormatters } from "@/i18n/use-formatters";


/** UC-077: nhật ký kiểm toán (Admin). Tiêu thụ /api/admin/audit-logs. */
export default function AdminAuditLogsRoute() {
  const t = useTranslations();
  const fmt = useFormatters();
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [actor, setActor] = useState("");
  // E-19 (audit 2026-07-17): BE + service đã hỗ trợ from/to nhưng UI thiếu input.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [applied, setApplied] = useState<{ action?: string; targetType?: string; actor?: string; from?: string; to?: string }>({});

  const query = useQuery({
    queryKey: ["admin", "audit-logs", applied, page],
    queryFn: () => adminService.getAuditLogs({ page, size: 20, ...applied }),
  });
  const items = query.data?.content ?? [];

  function apply() {
    setPage(0);
    setApplied({
      action: action.trim() || undefined,
      targetType: targetType.trim() || undefined,
      actor: actor.trim() || undefined,
      // BE nhận ISO DATE_TIME — datetime-local thiếu giây, thêm ":00".
      from: from ? from + ":00" : undefined,
      to: to ? to + ":00" : undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">{t("admin.auditLogs.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.auditLogs.subtitle")}
        </p>
      </section>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.auditLogs.action")}
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="VD: DISPUTE_RESOLVE" className="w-52" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.auditLogs.target")}
          <Input value={targetType} onChange={(e) => setTargetType(e.target.value)} placeholder="VD: Booking" className="w-44" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.auditLogs.actor")}
          <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="username" className="w-44" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.auditLogs.from")}
          <DateTimePicker value={from} onChange={(v) => setFrom(v ?? "")} className="w-52" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.auditLogs.to")}
          <DateTimePicker value={to} onChange={(v) => setTo(v ?? "")} className="w-52" />
        </label>
        <Button onClick={apply}>{t("common.actions.filter")}</Button>
      </div>

      <DataTable
        rows={items}
        rowKey={(l) => String(l.id)}
        loading={query.isLoading}
        error={query.isError}
        errorTitle={t("admin.auditLogs.loadError")}
        errorDescription={query.isError ? toErrorMessage(query.error) : undefined}
        onRetry={() => query.refetch()}
        emptyTitle={t("admin.auditLogs.emptyTitle")}
        emptyDescription={t("admin.auditLogs.emptyDescription")}
        columns={[
          {
            // Bug S2-10: bấm tiêu đề cột để sắp xếp tăng/giảm dần.
            key: "time",
            header: t("admin.auditLogs.time"),
            cellClassName: "whitespace-nowrap text-muted-foreground",
            sortValue: (l) => l.timestamp,
            cell: (l) => fmt.dateTimeSeconds(l.timestamp),
          },
          {
            key: "action",
            header: t("admin.auditLogs.action"),
            sortValue: (l) => l.action,
            cell: (l) => (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-black">
                <ClipboardList className="size-3" />
                {l.action}
              </span>
            ),
          },
          {
            key: "target",
            header: t("admin.auditLogs.target"),
            hideBelow: "sm",
            sortValue: (l) => `${l.targetType}${l.targetId ?? ""}`,
            cell: (l) => `${l.targetType}${l.targetId ? ` #${l.targetId}` : ""}`,
          },
          {
            key: "actor",
            header: t("admin.auditLogs.actor"),
            cellClassName: "font-semibold",
            sortValue: (l) => l.actor,
            cell: (l) => l.actor,
          },
          {
            key: "description",
            header: t("admin.auditLogs.description"),
            hideBelow: "lg",
            cellClassName: "text-muted-foreground",
            cell: (l) => <TableEllipsis>{l.description}</TableEllipsis>,
          },
        ]}
        footer={
          <Pagination
            page={page}
            zeroBased
            totalPages={query.data?.totalPages ?? 0}
            totalItems={query.data?.totalElements}
            pageSize={20}
            onPageChange={setPage}
            disabled={query.isLoading}
          />
        }
      />
    </main>
  );
}
