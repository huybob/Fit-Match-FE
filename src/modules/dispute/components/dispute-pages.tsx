"use client";

import { Paperclip, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import type { Dispute, DisputeStatus } from "@/services/dispute.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useAddEvidence,
  useDisputeEvidence,
  useMyDisputes,
} from "../hooks/use-dispute";

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  OPEN: "Đang mở",
  UNDER_REVIEW: "Đang xem xét",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
  ESCALATED: "Đã chuyển cấp",
};

export function disputeStatusVariant(status: DisputeStatus): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "RESOLVED" || status === "CLOSED") return "success";
  if (status === "ESCALATED") return "destructive";
  if (status === "UNDER_REVIEW") return "info";
  return "warning";
}

const money = (v?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v ?? 0);

/** UC-063/064: màn tranh chấp của các bên (customer/gym/pt). */
export function MyDisputesPage() {
  const query = useMyDisputes();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">Tranh chấp / Khiếu nại</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Theo dõi các khiếu nại liên quan đến buổi tập của bạn và gửi bằng chứng (UC-063/064).
        </p>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được tranh chấp" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có tranh chấp" description="Bạn có thể mở tranh chấp từ chi tiết một booking." />
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
                <Badge variant={disputeStatusVariant(d.status)}>{disputeStatusLabels[d.status]}</Badge>
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
  const { toast } = useToast();
  const evidence = useDisputeEvidence(dispute.id);
  const addEvidence = useAddEvidence();
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const canAdd = dispute.status !== "CLOSED";

  async function submit() {
    if (!description.trim()) {
      toast({ type: "warning", title: "Nhập mô tả bằng chứng" });
      return;
    }
    try {
      await addEvidence.mutateAsync({ id: dispute.id, payload: { description: description.trim(), fileUrl: fileUrl.trim() || undefined } });
      toast({ type: "success", title: "Đã gửi bằng chứng" });
      setDescription("");
      setFileUrl("");
    } catch (e) {
      toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) });
    }
  }

  return (
    <Dialog open title={`Tranh chấp #${dispute.id}`} onClose={onClose}>
      <div className="rounded-2xl bg-muted/40 p-4 text-sm">
        <div className="flex items-center justify-between">
          <Badge variant={disputeStatusVariant(dispute.status)}>{disputeStatusLabels[dispute.status]}</Badge>
          {dispute.resolution && <span className="text-xs font-black">{dispute.resolution}</span>}
        </div>
        <p className="mt-2"><b>Lý do:</b> {dispute.reason}</p>
        <p className="mt-1 text-muted-foreground">Booking #{dispute.bookingId} · {dispute.gymName}</p>
        {dispute.frozenAmount != null && dispute.frozenAmount > 0 && (
          <p className="mt-1 text-muted-foreground">Số tiền đang giữ: {money(dispute.frozenAmount)}</p>
        )}
        {dispute.moderatorNote && (
          <p className="mt-2 rounded-lg bg-card p-2"><b>Điều phối viên:</b> {dispute.moderatorNote}</p>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-black">Bằng chứng</h4>
        {evidence.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
        ) : !evidence.data?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">Chưa có bằng chứng.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {evidence.data.map((e) => (
              <li key={e.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p>{e.description}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{e.submittedBy}</span>
                  {e.fileUrl && (
                    <a href={e.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Paperclip className="size-3" /> Tệp
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canAdd && (
        <div className="mt-4 space-y-2 rounded-2xl border border-border p-4">
          <p className="text-sm font-black">Gửi bằng chứng mới</p>
          <Textarea placeholder="Mô tả" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="URL tệp (tùy chọn) — upload qua /api/files" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
          <Button disabled={addEvidence.isPending} onClick={submit}>
            <Plus className="size-4" /> Gửi bằng chứng
          </Button>
        </div>
      )}
    </Dialog>
  );
}
