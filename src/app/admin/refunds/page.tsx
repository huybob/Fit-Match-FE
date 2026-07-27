"use client";

// D-2 (audit 2026-07-17, UC-056): trước đây KHÔNG có màn admin duyệt refund —
// tiền khách treo REFUND_PENDING không ai xử lý được qua UI dù BE hoàn chỉnh.

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog } from "@/shared/components/ui/dialog";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import type { RefundRequest, RefundStatus } from "@/types/Booking";
import { useTranslations } from "next-intl";
import { REFUND_STATUS_ORDER } from "@/shared/utils/enum-label.util";
import { Pagination } from "@/shared/components/ui/pagination";
import { TableEllipsis } from "@/shared/components/ui/table";
import { DataTable } from "@/shared/components/common/data-table";

const PAGE_SIZE = 10;


const STATUS_VARIANT: Record<RefundStatus, "default" | "success" | "destructive" | "warning"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  EXECUTED: "success",
};

function DecisionDialog({
  refund,
  decision,
  onClose,
}: {
  refund: RefundRequest;
  decision: "approve" | "reject";
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();
  const [note, setNote] = useState("");
  const [partial, setPartial] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<string>("");

  const mutation = useMutation({
    mutationFn: () =>
      decision === "approve"
        ? adminService.approveRefund(refund.id, {
            approvedAmount: partial && approvedAmount ? Number(approvedAmount) : undefined,
            note: note.trim() || undefined,
          })
        : adminService.rejectRefund(refund.id, { note: note.trim() || undefined }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "refunds"] });
      toast({
        type: "success",
        title: decision === "approve" ? t("admin.refunds.refundedToast") : t("admin.refunds.rejectedToast"),
        description:
          decision === "approve"
            ? t("admin.refunds.refundedDesc")
            : t("admin.refunds.rejectedDesc"),
      });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const amountInvalid =
    partial &&
    (!approvedAmount || Number(approvedAmount) <= 0 || Number(approvedAmount) > refund.amount);

  return (
    <Dialog
      open
      title={decision === "approve"
        ? t("admin.refunds.approveDialogTitle", { id: refund.id })
        : t("admin.refunds.rejectDialogTitle", { id: refund.id })}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Booking #{refund.bookingId} · {t("admin.refunds.requestedAmount")}: <span className="font-semibold text-foreground">{formatCurrency(refund.amount)}</span>
          {refund.reason ? <> · {t("common.table.reason")}: {refund.reason}</> : null}
        </p>

        {decision === "approve" && (
          <div className="space-y-2">
            <CheckboxField
              alignTop
              checked={partial}
              onCheckedChange={setPartial}
              label={t("admin.refunds.partialLabel")}
              description={t("admin.refunds.partialHint")}
            />
            {partial && (
              <div>
                <Input
                  type="number"
                  min={1}
                  max={refund.amount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  placeholder={t("admin.refunds.maxPlaceholder", { max: formatCurrency(refund.amount) })}
                />
                {amountInvalid && (
                  <p className="mt-1 text-xs text-destructive">{t("admin.refunds.amountRange", { max: formatCurrency(refund.amount) })}</p>
                )}
              </div>
            )}
          </div>
        )}

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t("admin.refunds.notePlaceholder")}
          className="resize-none"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || amountInvalid}
            className={`gap-2 text-destructive-foreground ${decision === "approve" ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive"}`}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {decision === "approve" ? t("admin.refunds.confirmRefund") : t("admin.refunds.confirmReject")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function AdminRefundsPage() {
  const t = useTranslations();
  const [status, setStatus] = useState<string>("PENDING");
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<{ refund: RefundRequest; decision: "approve" | "reject" } | null>(null);

  const query = useQuery({
    queryKey: ["admin", "refunds", status, page],
    queryFn: () =>
      adminService.listRefunds({
        status: (status || undefined) as RefundStatus | undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const refunds = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const totalElements = query.data?.totalElements ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.refunds.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.refunds.subtitle")}
          </p>
        </div>
        <div className="w-44">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("common.filters.allStatuses")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("common.filters.allStatuses")}</SelectItem>
              {REFUND_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{t(`common.refundStatus.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <DataTable
          className="rounded-none"
          rows={refunds}
          rowKey={(r) => String(r.id)}
          loading={query.isLoading}
          error={query.isError}
          errorTitle={t("admin.refunds.loadError")}
          errorDescription={query.isError ? toErrorMessage(query.error) : undefined}
          onRetry={() => query.refetch()}
          emptyTitle={t("admin.refunds.empty")}
          columns={[
            { key: "id", header: t("common.table.code"), cell: (r) => `#${r.id}` },
            {
              key: "bookingId",
              header: t("admin.refunds.colBooking"),
              hideBelow: "sm",
              cell: (r) => `#${r.bookingId}`,
            },
            {
              key: "amount",
              header: t("common.table.amount"),
              align: "right",
              cellClassName: "font-semibold text-foreground",
              cell: (r) => formatCurrency(r.amount),
            },
            {
              key: "reason",
              header: t("common.table.reason"),
              hideBelow: "lg",
              cellClassName: "text-muted-foreground",
              cell: (r) => <TableEllipsis title={r.reason ?? undefined}>{r.reason ?? "—"}</TableEllipsis>,
            },
            {
              key: "requestedBy",
              header: t("admin.refunds.requester"),
              hideBelow: "lg",
              cellClassName: "text-muted-foreground",
              cell: (r) => r.requestedBy ?? "—",
            },
            {
              key: "status",
              header: t("common.table.status"),
              cell: (r) => (
                <>
                  <Badge variant={STATUS_VARIANT[r.status]}>{t(`common.refundStatus.${r.status}`)}</Badge>
                  {r.decisionNote && (
                    <p className="mt-1 text-[11px] text-muted-foreground">{r.decisionNote}</p>
                  )}
                </>
              ),
            },
            {
              key: "actions",
              header: t("common.table.actions"),
              align: "right",
              cell: (r) =>
                r.status === "PENDING" ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      className="h-8 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
                      onClick={() => setAction({ refund: r, decision: "approve" })}
                    >
                      {t("common.actions.approve")}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs text-destructive"
                      onClick={() => setAction({ refund: r, decision: "reject" })}
                    >
                      {t("common.actions.reject")}
                    </Button>
                  </div>
                ) : null,
            },
          ]}
        />

        <Pagination
          className="border-t border-border px-5 py-3"
          page={page}
          zeroBased
          totalPages={totalPages}
          totalItems={totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {action && <DecisionDialog refund={action.refund} decision={action.decision} onClose={() => setAction(null)} />}
    </div>
  );
}
