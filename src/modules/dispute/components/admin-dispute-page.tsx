"use client";

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
import { useDisputeDecision, useDisputeEvidence, useDisputeQueue } from "../hooks/use-dispute";
import { disputeStatusLabels, disputeStatusVariant } from "./dispute-pages";

const money = (v?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v ?? 0);

const resolutionLabels: Record<DisputeResolution, string> = {
  REFUND_FULL: "Hoàn toàn bộ cho khách",
  REFUND_PARTIAL: "Hoàn một phần cho khách",
  SPLIT: "Chia (hoàn một phần, còn lại về gym)",
  RELEASE_TO_GYM: "Giải phóng toàn bộ cho gym",
  NO_ACTION: "Không hành động tài chính",
  PENALTY: "Phạt gym/PT (hoàn cho khách)",
};

const needsAmount = (r: DisputeResolution) => r === "REFUND_PARTIAL" || r === "SPLIT";

/** UC-065..068: màn xử lý tranh chấp (Moderator/Admin). */
export function AdminDisputesPage() {
  const [status, setStatus] = useState<DisputeStatus | "">("");
  const query = useDisputeQueue(status || undefined);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
        <h1 className="text-3xl font-black">Xử lý tranh chấp</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Xem bằng chứng, quyết định hoàn/giải phóng tiền và đóng/chuyển cấp (UC-065..068).
        </p>
      </section>

      <Select value={status} onValueChange={(v) => setStatus(v as DisputeStatus | "")}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tất cả trạng thái</SelectItem>
          {(Object.keys(disputeStatusLabels) as DisputeStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{disputeStatusLabels[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title="Không tải được" description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title="Không có tranh chấp" description="Chưa có tranh chấp ở trạng thái này." />
        ) : (
          <div className="grid gap-4">
            {items.map((d) => (
              <article key={d.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-black">
                    <ShieldAlert className="size-4 text-destructive" /> #{d.id} · Booking #{d.bookingId}
                    <span className="font-normal text-muted-foreground">· {d.openedByRole}</span>
                  </span>
                  <Badge variant={disputeStatusVariant(d.status)}>{disputeStatusLabels[d.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{d.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.customerName} → {d.gymName}{d.ptName ? ` · ${d.ptName}` : ""}
                  {d.frozenAmount ? ` · giữ ${money(d.frozenAmount)}` : ""}
                </p>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => setSelected(d)}>
                    <Gavel className="size-4" /> Xử lý
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
  const { toast } = useToast();
  const evidence = useDisputeEvidence(dispute.id, true);
  const decision = useDisputeDecision();
  const [resolution, setResolution] = useState<DisputeResolution>("REFUND_FULL");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");

  async function act(action: "review" | "resolve" | "close" | "escalate") {
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
      toast({ type: "success", title: "Đã cập nhật tranh chấp" });
      onClose();
    } catch (e) {
      toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) });
    }
  }

  return (
    <Dialog open title={`Xử lý tranh chấp #${dispute.id}`} onClose={onClose}>
      <div className="rounded-2xl bg-muted/40 p-4 text-sm">
        <p><b>Lý do:</b> {dispute.reason}</p>
        <p className="mt-1 text-muted-foreground">
          Booking #{dispute.bookingId} · {dispute.customerName} → {dispute.gymName}
          {dispute.frozenAmount ? ` · giữ ${money(dispute.frozenAmount)}` : ""}
        </p>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-black">Bằng chứng</h4>
        {evidence.isLoading ? (
          <p className="mt-1 text-sm text-muted-foreground">Đang tải...</p>
        ) : !evidence.data?.length ? (
          <p className="mt-1 text-sm text-muted-foreground">Chưa có bằng chứng.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {evidence.data.map((e) => (
              <li key={e.id} className="rounded-lg border border-border bg-card p-2 text-sm">
                {e.description}
                <span className="ml-1 text-xs text-muted-foreground">— {e.submittedBy}</span>
                {e.fileUrl && (
                  <a href={e.fileUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">
                    <Paperclip className="size-3" />tệp
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {["OPEN", "UNDER_REVIEW", "ESCALATED"].includes(dispute.status) && (
        <div className="mt-4 space-y-3 rounded-2xl border border-border p-4">
          <p className="text-sm font-black">Quyết định (UC-066/067)</p>
          <Select value={resolution} onValueChange={(v) => setResolution(v as DisputeResolution)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(resolutionLabels) as DisputeResolution[]).map((r) => (
                <SelectItem key={r} value={r}>{resolutionLabels[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {needsAmount(resolution) && (
            <Input
              type="number"
              placeholder={`Số tiền hoàn cho khách (tối đa ${money(dispute.frozenAmount)})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
          <Textarea placeholder="Ghi chú quyết định" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {dispute.status === "OPEN" && (
              <Button variant="outline" disabled={decision.isPending} onClick={() => act("review")}>
                Bắt đầu xem xét
              </Button>
            )}
            <Button disabled={decision.isPending} onClick={() => act("resolve")}>
              <CheckCircle2 className="size-4" /> Quyết định & áp dụng
            </Button>
            <Button variant="destructive" disabled={decision.isPending} onClick={() => act("escalate")}>
              <ArrowUpCircle className="size-4" /> Chuyển cấp
            </Button>
          </div>
        </div>
      )}

      {dispute.status === "RESOLVED" && (
        <div className="mt-4">
          <Textarea className="mb-2" placeholder="Ghi chú đóng" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button disabled={decision.isPending} onClick={() => act("close")}>
            <Lock className="size-4" /> Đóng tranh chấp
          </Button>
        </div>
      )}
    </Dialog>
  );
}
