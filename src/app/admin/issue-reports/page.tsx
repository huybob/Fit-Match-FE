"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarCheck, Check, Flag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import {
  issueReportService,
  type IssueReport,
  type IssueReportStatus,
} from "@/services/issue-report.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/use-formatters";

/** Map sang key i18n — nhãn resolve trong component vì t() cần hook. */
const statusKeys = {
  OPEN: "statusOpen",
  RESOLVED: "statusResolved",
  DISMISSED: "statusDismissed",
} as const satisfies Record<IssueReportStatus, string>;
const statusClass: Record<IssueReportStatus, string> = {
  OPEN: "bg-warning-muted text-warning",
  RESOLVED: "bg-success-muted text-success",
  DISMISSED: "bg-muted text-muted-foreground",
};
const targetIcons = { GYM: Building2, PT: UserRound, BOOKING: CalendarCheck };
const targetKeys = { GYM: "targetGym", PT: "targetTrainer", BOOKING: null } as const;


/** UC-070/071: hàng đợi báo cáo vấn đề dịch vụ/hành vi (ADMIN/MODERATOR). */
export default function AdminIssueReportsPage() {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"all" | IssueReportStatus>("OPEN");
  const [deciding, setDeciding] = useState<{ report: IssueReport; action: "resolve" | "dismiss" } | null>(null);
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["admin", "issue-reports", status],
    queryFn: () =>
      issueReportService.adminQueue(status === "all" ? {} : { status }),
  });

  const decideMut = useMutation({
    mutationFn: () =>
      deciding!.action === "resolve"
        ? issueReportService.adminResolve(deciding!.report.id!, note.trim() || undefined)
        : issueReportService.adminDismiss(deciding!.report.id!, note.trim() || undefined),
    onSuccess: () => {
      toast({ type: "success", title: deciding?.action === "resolve" ? t("admin.issueReports.resolvedToast") : t("admin.issueReports.dismissedToast") });
      qc.invalidateQueries({ queryKey: ["admin", "issue-reports"] });
      setDeciding(null);
      setNote("");
    },
    onError: (e) => toast({ type: "error", title: t("admin.issueReports.actionFailed"), description: toErrorMessage(e) }),
  });

  const items = query.data?.content ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title={t("admin.issueReports.title")}
          description={t("admin.issueReports.subtitle")}
        />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">{t("admin.issueReports.statusOpen")}</SelectItem>
            <SelectItem value="RESOLVED">{t("admin.issueReports.statusResolved")}</SelectItem>
            <SelectItem value="DISMISSED">{t("admin.issueReports.statusDismissed")}</SelectItem>
            <SelectItem value="all">{t("common.filters.all")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("admin.issueReports.loadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("admin.issueReports.emptyTitle")} description={t("admin.issueReports.emptyDescription")} />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const Icon = targetIcons[r.targetType ?? "GYM"];
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      <Flag className="size-4 text-destructive" />
                      #{r.id} · {targetKeys[r.targetType ?? "GYM"]
                        ? t(`admin.issueReports.${targetKeys[r.targetType ?? "GYM"]!}`)
                        : "Booking"}
                      <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Icon className="size-3.5" />
                        {r.targetName ?? `#${r.targetId}`}
                      </span>
                      <Badge className={statusClass[r.status ?? "OPEN"]}>
                        {t(`admin.issueReports.${statusKeys[r.status ?? "OPEN"]}`)}
                      </Badge>
                    </p>
                    <p className="mt-1.5 text-sm text-foreground">{r.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("admin.issueReports.reportedBy")} <b>{r.reportedBy}</b> · {fmt.dateTimeShort(r.createdAt)}
                      {r.moderatorNote && <> · {t("admin.issueReports.moderatorNote")} {r.moderatorNote}</>}
                    </p>
                  </div>
                  {r.status === "OPEN" && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-success text-success-foreground hover:bg-success"
                        onClick={() => { setDeciding({ report: r, action: "resolve" }); setNote(""); }}
                      >
                        <Check className="size-3.5" /> {t("admin.issueReports.handle")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => { setDeciding({ report: r, action: "dismiss" }); setNote(""); }}
                      >
                        <X className="size-3.5" /> {t("admin.issueReports.statusDismissed")}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={!!deciding}
        title={deciding?.action === "resolve" ? t("admin.issueReports.resolveTitle") : t("admin.issueReports.dismissTitle")}
        onClose={() => setDeciding(null)}
      >
        <p className="text-sm text-muted-foreground">
          {deciding?.action === "resolve"
            ? t("admin.issueReports.resolveHint")
            : t("admin.issueReports.dismissHint")}
        </p>
        <Textarea
          className="mt-3"
          rows={3}
          maxLength={500}
          placeholder={t("admin.issueReports.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeciding(null)}>{t("common.actions.cancel")}</Button>
          <Button
            disabled={decideMut.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => decideMut.mutate()}
          >
            {decideMut.isPending ? t("common.states.saving") : t("common.actions.confirm")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
