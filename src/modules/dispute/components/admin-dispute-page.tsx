"use client";

import { formatCurrency } from "@/utils/format.util";
import { ArrowUpCircle, CheckCircle2, Gavel, Lock, Paperclip, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import type { Dispute, DisputeResolution, DisputeStatus } from "@/services/dispute.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
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
import { PageHeader } from "@/shared/components/common/page-header";
import { useDisputeDecision, useDisputeEvidence, useDisputeQueue } from "../hooks/use-dispute";
import { DISPUTE_STATUS_ORDER, disputeStatusVariant } from "./dispute-pages";
import { useTranslations } from "next-intl";

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

/** Thứ tự hiển thị phương án xử lý; nhãn ở dispute.resolution.* */
const RESOLUTION_ORDER: DisputeResolution[] = [
  "REFUND_FULL",
  "REFUND_PARTIAL",
  "SPLIT",
  "RELEASE_TO_GYM",
  "NO_ACTION",
  "PENALTY",
];

const needsAmount = (r: DisputeResolution) => r === "REFUND_PARTIAL" || r === "SPLIT";

/** UC-065..068: màn xử lý tranh chấp (Moderator/Admin). */
export function AdminDisputesPage() {
  const t = useTranslations();
  const [status, setStatus] = useState<DisputeStatus | "">("");
  const query = useDisputeQueue(status || undefined);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const items = query.data?.content ?? [];

  return (
    <div>
      <PageHeader
        title={t("dispute.adminTitle")}
        description={t("dispute.adminSubtitle")}
      />

      <Select value={status} onValueChange={(v) => setStatus(v as DisputeStatus | "")}>
        <SelectTrigger className="w-64"><SelectValue placeholder={t("common.filters.allStatuses")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t("common.filters.allStatuses")}</SelectItem>
          {DISPUTE_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>{t(`dispute.status.${s}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title={t("common.states.errorTitle")} description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title={t("dispute.adminEmpty")} description={t("dispute.adminEmptyHint")} />
        ) : (
          <div className="grid gap-4">
            {items.map((d) => (
              <article key={d.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-black">
                    <ShieldAlert className="size-4 text-destructive" /> #{d.id} · Booking #{d.bookingId}
                    <span className="font-normal text-muted-foreground">· {d.openedByRole}</span>
                  </span>
                  <Badge variant={disputeStatusVariant(d.status)}>{t(`dispute.status.${d.status}`)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{d.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.customerName} → {d.gymName}{d.ptName ? ` · ${d.ptName}` : ""}
                  {d.frozenAmount ? ` · ${t("dispute.heldAmount", { amount: money(d.frozenAmount) })}` : ""}
                </p>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => setSelected(d)}>
                    <Gavel className="size-4" /> {t("dispute.handle")}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected && <ModerationDialog dispute={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ModerationDialog({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const evidence = useDisputeEvidence(dispute.id, true);
  const decision = useDisputeDecision();
  const [resolution, setResolution] = useState<DisputeResolution>("REFUND_FULL");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");


  // D-9: chặn hoàn vượt số tiền đang giữ ngay tại client (BE vẫn validate lại).
  const maxRefund = dispute.frozenAmount ?? 0;
  const amountInvalid =
    needsAmount(resolution) && (!amount || Number(amount) <= 0 || Number(amount) > maxRefund);

  async function act(action: "review" | "resolve" | "close" | "escalate") {
    if (action === "resolve" && amountInvalid) {
      toast({
        type: "warning",
        title: t("dispute.invalidRefund"),
        description: t("dispute.refundRange", { max: money(maxRefund) }),
      });
      return;
    }
    try {
      if (action === "resolve") {
        await decision.mutateAsync({
          id: dispute.id,
          action,
          payload: {
            resolution,
            refundAmount: needsAmount(resolution) ? Number(amount) : undefined,
            note: note.trim() || undefined,
          },
        });
      } else {
        await decision.mutateAsync({ id: dispute.id, action, note: note.trim() || undefined });
      }
      toast({ type: "success", title: t("dispute.updated") });
      onClose();
    } catch (e) {
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) });
    }
  }

  return (
    <Dialog open title={t("dispute.moderateTitle", { id: dispute.id })} onClose={onClose}>
      <div className="rounded-2xl bg-muted/40 p-4 text-sm">
        <p><b>{t("dispute.reasonLabel")}</b> {dispute.reason}</p>
        <p className="mt-1 text-muted-foreground">
          Booking #{dispute.bookingId} · {dispute.customerName} → {dispute.gymName}
          {dispute.frozenAmount ? ` · ${t("dispute.heldAmount", { amount: money(dispute.frozenAmount) })}` : ""}
        </p>
        {dispute.assignedModerator && (
          <p className="mt-1 text-xs font-semibold text-primary">
            {t("dispute.assignee")} {dispute.assignedModerator}
          </p>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-black">{t("dispute.evidence")}</h4>
        {evidence.isLoading ? (
          <p className="mt-1 text-sm text-muted-foreground">{t("common.states.loading")}</p>
        ) : !evidence.data?.length ? (
          <p className="mt-1 text-sm text-muted-foreground">{t("dispute.noEvidence")}</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {evidence.data.map((e) => (
              <li key={e.id} className="rounded-lg border border-border bg-card p-2 text-sm">
                {e.description}
                <span className="ml-1 text-xs text-muted-foreground">— {e.submittedBy}</span>
                {e.fileUrl && (
                  <a href={e.fileUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">
                    <Paperclip className="size-3" />{t("dispute.fileLabel")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {["OPEN", "UNDER_REVIEW", "ESCALATED"].includes(dispute.status) && (
        <div className="mt-4 space-y-3 rounded-2xl border border-border p-4">
          <p className="text-sm font-black">{t("dispute.decisionTitle")}</p>
          <Select value={resolution} onValueChange={(v) => setResolution(v as DisputeResolution)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESOLUTION_ORDER.map((r) => (
                <SelectItem key={r} value={r}>{t(`dispute.resolution.${r}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {needsAmount(resolution) && (
            <div>
              <Input
                type="number"
                min={1}
                max={maxRefund}
                placeholder={t("dispute.refundAmountPlaceholder", { max: money(maxRefund) })}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amountInvalid && amount && (
                <p className="mt-1 text-xs text-destructive">{t("dispute.heldNote", { max: money(maxRefund) })}</p>
              )}
            </div>
          )}
          <Textarea placeholder={t("dispute.decisionNote")} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {/* D-20: khớp guard BE — review nhận cả OPEN lẫn ESCALATED (claim case D-12);
                escalate chỉ từ OPEN/UNDER_REVIEW (ESCALATED bấm lại sẽ 409). */}
            {(dispute.status === "OPEN" || dispute.status === "ESCALATED") && (
              <Button variant="outline" disabled={decision.isPending} onClick={() => act("review")}>
                {t("dispute.startReview")}
              </Button>
            )}
            <Button disabled={decision.isPending} onClick={() => act("resolve")}>
              <CheckCircle2 className="size-4" /> {t("dispute.applyDecision")}
            </Button>
            {dispute.status !== "ESCALATED" && (
              <Button variant="destructive" disabled={decision.isPending} onClick={() => act("escalate")}>
                <ArrowUpCircle className="size-4" /> {t("dispute.escalate")}
              </Button>
            )}
          </div>
        </div>
      )}

      {dispute.status === "RESOLVED" && (
        <div className="mt-4">
          <Textarea className="mb-2" placeholder={t("dispute.closeNote")} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button disabled={decision.isPending} onClick={() => act("close")}>
            <Lock className="size-4" /> {t("dispute.close")}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
