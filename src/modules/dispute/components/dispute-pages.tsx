"use client";

import { formatCurrency } from "@/utils/format.util";
import { Paperclip, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import type { Dispute, DisputeStatus } from "@/services/dispute.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { openSecureFile } from "@/shared/utils/secure-file.util";
import { FileUpload } from "@/shared/components/common/file-upload";
import { PageHeader } from "@/shared/components/common/page-header";
import {
  useAddEvidence,
  useDisputeEvidence,
  useMyDisputes,
} from "../hooks/use-dispute";
import { useTranslations } from "next-intl";

/** Thứ tự hiển thị trạng thái tranh chấp; nhãn ở dispute.status.* */
export const DISPUTE_STATUS_ORDER: DisputeStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "CLOSED",
  "ESCALATED",
];

export function disputeStatusVariant(status: DisputeStatus): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "RESOLVED" || status === "CLOSED") return "success";
  if (status === "ESCALATED") return "destructive";
  if (status === "UNDER_REVIEW") return "info";
  return "warning";
}

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

/** UC-063/064: màn tranh chấp của các bên (customer/gym/pt). */
export function MyDisputesPage() {
  const t = useTranslations();
  const query = useMyDisputes();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const items = query.data?.content ?? [];

  return (
    <div>
      <PageHeader
        title={t("dispute.myTitle")}
        description={t("dispute.mySubtitle")}
      />

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("dispute.myLoadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("dispute.myEmpty")} description={t("dispute.myEmptyHint")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d)}
              className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/60 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-black">
                  <ShieldAlert className="size-4 text-destructive" /> #{d.id} · Booking #{d.bookingId}
                </span>
                <Badge variant={disputeStatusVariant(d.status)}>{t(`dispute.status.${d.status}`)}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{d.reason}</p>
              <p className="mt-2 text-xs text-muted-foreground">{d.gymName}{d.ptName ? ` · ${d.ptName}` : ""}</p>
            </button>
          ))}
        </div>
      )}

      {selected && <DisputeDetailDialog dispute={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DisputeDetailDialog({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const evidence = useDisputeEvidence(dispute.id);
  const addEvidence = useAddEvidence();
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const canAdd = dispute.status !== "CLOSED";

  async function submit() {
    if (!description.trim()) {
      toast({ type: "warning", title: t("dispute.evidenceDescRequired") });
      return;
    }
    try {
      await addEvidence.mutateAsync({ id: dispute.id, payload: { description: description.trim(), fileUrl: fileUrl.trim() || undefined } });
      toast({ type: "success", title: t("dispute.evidenceSent") });
      setDescription("");
      setFileUrl("");
    } catch (e) {
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) });
    }
  }

  return (
    <Dialog open title={t("dispute.detailTitle", { id: dispute.id })} onClose={onClose}>
      <div className="rounded-2xl bg-muted/40 p-4 text-sm">
        <div className="flex items-center justify-between">
          <Badge variant={disputeStatusVariant(dispute.status)}>{t(`dispute.status.${dispute.status}`)}</Badge>
          {dispute.resolution && <span className="text-xs font-black">{dispute.resolution}</span>}
        </div>
        <p className="mt-2"><b>{t("dispute.reasonLabel")}</b> {dispute.reason}</p>
        <p className="mt-1 text-muted-foreground">Booking #{dispute.bookingId} · {dispute.gymName}</p>
        {dispute.frozenAmount != null && dispute.frozenAmount > 0 && (
          <p className="mt-1 text-muted-foreground">{t("dispute.heldAmount")} {money(dispute.frozenAmount)}</p>
        )}
        {dispute.moderatorNote && (
          <p className="mt-2 rounded-lg bg-card p-2"><b>{t("dispute.moderator")}</b> {dispute.moderatorNote}</p>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-black">{t("dispute.evidence")}</h4>
        {evidence.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("common.states.loading")}</p>
        ) : !evidence.data?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("dispute.noEvidence")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {evidence.data.map((e) => (
              <li key={e.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <p>{e.description}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{e.submittedBy}</span>
                  {e.fileUrl && (
                    // D-10/B-6: tệp evidence nằm ở /api/files/documents (cần Bearer) — mở qua blob.
                    <Button variant="link" size="inline"
 type="button"
 onClick={() => openSecureFile(e.fileUrl!).catch((err) =>
 toast({ type: "error", title: t("dispute.openFileFailed"), description: toErrorMessage(err) }))}
 className="flex gap-1 text-primary"
>
                      <Paperclip className="size-3" /> {t("dispute.fileWord")}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canAdd && (
        <div className="mt-4 space-y-2 rounded-2xl border border-border p-4">
          <p className="text-sm font-black">{t("dispute.newEvidenceTitle")}</p>
          <Textarea placeholder={t("common.table.description")} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
          {/* D-10 (audit 2026-07-17): upload tệp thật thay ô nhập URL tay — trước đây
              người dùng thường không có cách nào nộp bằng chứng thực tế. */}
          <FileUpload
            value={fileUrl}
            onChange={setFileUrl}
            folder="documents"
            label={t("dispute.attachOptional")}
          />
          <Button disabled={addEvidence.isPending} onClick={submit}>
            <Plus className="size-4" /> {t("dispute.sendEvidence")}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
