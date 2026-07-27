"use client";

import { EyeOff, Flag, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import type { ReportStatus, ReviewReport, ReviewStatus } from "@/services/review.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { PageHeader } from "@/shared/components/common/page-header";
import {
  useModerateReview,
  useResolveReport,
  useReviewReports,
} from "../hooks/use-review";
import { useTranslations } from "next-intl";

/* Nhãn trạng thái báo cáo ở review.mod.* */

/** UC-071: màn kiểm duyệt review theo báo cáo (Moderator/Admin). */
export function ReviewModerationPage() {
  const t = useTranslations();
  const [status, setStatus] = useState<ReportStatus>("OPEN");
  const query = useReviewReports(status);
  const reports = query.data?.content ?? [];

  return (
    <div>
      <PageHeader
        title={t("review.modTitle")}
        description={t("review.modSubtitle")}
      />

      <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["OPEN", "RESOLVED", "DISMISSED"] as ReportStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{t(`review.mod.${s}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title={t("review.modLoadError")} description={toErrorMessage(query.error)} />
        ) : !reports.length ? (
          <EmptyState title={t("review.modEmpty")} description={t("review.modEmptyHint")} />
        ) : (
          <div className="grid gap-4">
            {reports.map((rep) => (
              <ReportCard key={rep.id} report={rep} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: ReviewReport }) {
  const t = useTranslations();
  const { toast } = useToast();
  const moderate = useModerateReview();
  const resolve = useResolveReport();
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<null | { status: ReviewStatus; label: string }>(null);
  const r = report.review;

  async function applyModeration() {
    if (!confirming) return;
    try {
      await moderate.mutateAsync({ id: r.id, payload: { status: confirming.status, note } });
      // Đồng thời đóng báo cáo (đã xử lý).
      await resolve.mutateAsync({ id: report.id, note });
      toast({ type: "success", title: t("review.modDone") });
      setConfirming(null);
    } catch (e) {
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) });
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-black text-destructive">
          <Flag className="size-4" /> {t("review.reportNumber", { id: report.id })}
          {report.reportedBy ? ` · ${report.reportedBy}` : ""}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black">
          {t(`review.mod.${report.status}`)}
        </span>
      </div>
      <p className="mt-2 text-sm"><b>{t("review.reasonLabel")}</b> {report.reason}</p>

      <div className="mt-4 rounded-xl bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-muted-foreground">
            Đánh giá #{r.id} · {r.customerName} → {r.gymName}{r.ptName ? ` · ${r.ptName}` : ""}
          </span>
          <span className="flex items-center gap-1 font-black text-accent">
            <Star className="size-4 fill-current" />{r.rating}/5
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{r.comment || t("review.noContent")}</p>
        <span className="mt-1 inline-block text-[10px] font-black text-muted-foreground">
          {t("review.reviewStatusLabel")} {r.status}
        </span>
      </div>

      {report.status === "OPEN" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setConfirming({ status: "HIDDEN", label: t("review.hideReview") })}>
            <EyeOff className="size-4" /> {t("review.hide")}
          </Button>
          <Button variant="destructive" onClick={() => setConfirming({ status: "REMOVED", label: t("review.removeReview") })}>
            <Trash2 className="size-4" /> {t("review.remove")}
          </Button>
          <Button onClick={() => setConfirming({ status: "VISIBLE", label: t("review.keepVisible") })}>
            <ShieldCheck className="size-4" /> {t("review.keep")}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await resolve.mutateAsync({ id: report.id, dismiss: true, note });
                toast({ type: "success", title: t("review.dismissed") });
              } catch (e) {
                toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) });
              }
            }}
          >
            <X className="size-4" /> {t("review.dismiss")}
          </Button>
        </div>
      )}

      {confirming && (
        <Dialog open title={confirming.label} onClose={() => setConfirming(null)}>
          <p className="text-sm text-muted-foreground">
            {t("review.applyToReview", { id: r.id })}
          </p>
          <Textarea className="mt-3" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <Button disabled={moderate.isPending || resolve.isPending} onClick={applyModeration}>{t("common.actions.confirm")}</Button>
            <Button variant="outline" onClick={() => setConfirming(null)}>{t("common.actions.cancel")}</Button>
          </div>
        </Dialog>
      )}
    </article>
  );
}
