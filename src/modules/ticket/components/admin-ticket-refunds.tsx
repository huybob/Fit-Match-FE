"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/utils/format.util";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { ticketService } from "@/services/ticket.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { adminRefundKeys } from "../query-keys";
import type { RefundMode } from "@/types/Ticket";

/**
 * Câu 11: admin quyết mức hoàn. KHÔNG có ô nhập số tiền — chỉ chọn giữa hai
 * phương án, số tiền do server tính để bất biến "hoàn + giữ lại = đã trả"
 * không thể bị gõ sai.
 */
export function AdminTicketRefundsPage() {
  const t = useTranslations("ticket.adminRefunds");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: adminRefundKeys.list("PENDING"),
    queryFn: () => ticketService.adminRefunds({ status: "PENDING" }),
  });

  if (isLoading) return <LoadingSkeleton />;
  const rows = data?.content ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("subtitle")} />
      ) : (
        <div className="divide-y rounded-md border">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{row.ticketTypeName ?? `#${row.ticketId}`}</p>
                <p className="text-sm text-muted-foreground">{row.reason}</p>
                <p className="text-sm">{formatCurrency(row.amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{row.status}</Badge>
                <Button size="sm" onClick={() => setOpenId(row.id)}>
                  {t("review")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openId ? <RefundDecisionDialog id={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function RefundDecisionDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const t = useTranslations("ticket.adminRefunds");
  const { toast } = useToast();
  const client = useQueryClient();
  const [mode, setMode] = useState<RefundMode>("FULL");
  const [note, setNote] = useState("");

  const { data: preview, isLoading } = useQuery({
    queryKey: adminRefundKeys.preview(id),
    queryFn: () => ticketService.adminRefundPreview(id),
  });

  const approve = useMutation({
    mutationFn: () => ticketService.adminApproveRefund(id, mode, note || undefined),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminRefundKeys.all });
      toast({ type: "success", title: t("approved") });
      onClose();
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  const reject = useMutation({
    mutationFn: () => ticketService.adminRejectRefund(id, note),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminRefundKeys.all });
      toast({ type: "success", title: t("rejected") });
      onClose();
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  return (
    <Dialog open onClose={onClose} title={t("dialogTitle")}>
      {isLoading || !preview ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-4 text-sm">
          <dl className="space-y-1">
            <Row label={t("customer")} value={preview.customerName} />
            <Row label={t("ticket")} value={preview.ticketTypeName} />
            <Row label={t("paid")} value={formatCurrency(preview.paidAmount)} />
            <Row
              label={t("usage")}
              value={t("usageValue", {
                elapsed: preview.elapsedDays,
                total: preview.dayCount,
                start: preview.startDate ?? "—",
              })}
            />
          </dl>

          <fieldset className="space-y-2">
            <legend className="font-medium">{t("chooseMode")}</legend>

            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3">
              <input
                type="radio"
                name="refund-mode"
                checked={mode === "FULL"}
                onChange={() => setMode("FULL")}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{t("modeFull")}</span>
                <span className="block text-muted-foreground">
                  {t("modeFullValue", { amount: formatCurrency(preview.fullRefund) })}
                </span>
              </span>
            </label>

            {/* Câu 13: vé chưa dùng ngày nào -> hai lựa chọn giống hệt nhau,
                chỉ hiện một để admin khỏi phải chọn giữa hai thứ như nhau. */}
            {!preview.fullRefundOnly ? (
              <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3">
                <input
                  type="radio"
                  name="refund-mode"
                  checked={mode === "PARTIAL_ELAPSED"}
                  onChange={() => setMode("PARTIAL_ELAPSED")}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">
                    {t("modePartial", { elapsed: preview.elapsedDays })}
                  </span>
                  <span className="block text-muted-foreground">
                    {t("modePartialValue", {
                      refund: formatCurrency(preview.partialRefund),
                      retained: formatCurrency(preview.retained),
                    })}
                  </span>
                </span>
              </label>
            ) : null}
          </fieldset>

          {/* Câu 12: duyệt là huỷ sạch buổi tương lai — nói trước, không để admin
              phát hiện sau khi tiền đã chuyển. */}
          {preview.futureSessionsToCancel > 0 ? (
            <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{t("cancelWarning", { count: preview.futureSessionsToCancel })}</p>
            </div>
          ) : null}

          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("notePlaceholder")}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={!note || reject.isPending}
              onClick={() => reject.mutate()}
            >
              {t("reject")}
            </Button>
            <Button disabled={approve.isPending} onClick={() => approve.mutate()}>
              {t("approve")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
