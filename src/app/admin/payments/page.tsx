"use client";

// UC-053/056: màn đối soát tiền vào. Trước đây webhook Casso chỉ ghi log.warn
// khi giao dịch không khớp booking (sai nội dung CK, thiếu/thừa tiền, vào sau
// khi đơn hết hạn, CK trùng) — tiền thật nằm trong tài khoản nền tảng mà không
// API/màn hình nào lần ra được. Đây là hàng đợi xử lý những ca đó.

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Pagination } from "@/shared/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import type {
  PaymentTransaction,
  PaymentTxnAnomaly,
  ReconStatus,
} from "@/types/Payment";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { Textarea } from "@/shared/components/ui/textarea";
import { useTranslations } from "next-intl";
import { PAYMENT_ANOMALY_ORDER, RECON_STATUS_ORDER } from "@/shared/utils/enum-label.util";
import { TableEllipsis } from "@/shared/components/ui/table";
import { DataTable } from "@/shared/components/common/data-table";

const PAGE_SIZE = 10;
const QUERY_KEY = ["admin", "payment-reconciliation"];


const ANOMALY_VARIANT: Record<PaymentTxnAnomaly, "warning" | "destructive" | "info"> = {
  UNMATCHED: "destructive",
  UNDERPAID: "warning",
  OVERPAID: "info",
  LATE_ARRIVAL: "destructive",
  DUPLICATE: "warning",
};


const RECON_VARIANT: Record<ReconStatus, "success" | "warning" | "default"> = {
  APPLIED: "success",
  NEEDS_REVIEW: "warning",
  RESOLVED_APPLIED: "success",
  RESOLVED_REFUNDED: "default",
  RESOLVED_IGNORED: "default",
};

/** Gắn giao dịch vào một booking đang chờ thanh toán. */
function ApplyDialog({ txn, onClose }: { txn: PaymentTransaction; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();
  const [ticketId, setTicketId] = useState(txn.ticketId ? String(txn.ticketId) : "");
  const [note, setNote] = useState("");
  const [allowAmountMismatch, setAllowAmountMismatch] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      adminService.applyPaymentTransaction(txn.id, {
        ticketId: Number(ticketId),
        allowAmountMismatch,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        type: "success",
        title: t("admin.payments.linked"),
        description: t("admin.payments.linkedDesc"),
      });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("admin.payments.linkFailed"), description: toErrorMessage(e) }),
  });

  const idInvalid = !ticketId || Number(ticketId) <= 0;
  // BE bắt buộc ghi chú khi bỏ qua kiểm tra số tiền — chặn sớm ở FE cho rõ.
  const noteRequired = allowAmountMismatch && !note.trim();

  return (
    <Dialog open title={t("admin.payments.linkDialogTitle", { id: txn.id })} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p>
            {t("admin.payments.amountReceived")} <span className="font-semibold text-foreground">{formatCurrency(txn.amount)}</span>
            {txn.refCode ? <> · {t("admin.payments.reconCode")} <span className="font-mono">{txn.refCode}</span></> : null}
          </p>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {t("admin.payments.transferNote")} {txn.rawDescription || "—"}
          </p>
          {txn.anomaly && (
            <p className="mt-2 text-xs text-muted-foreground">{t(`admin.payments.hint.${txn.anomaly}`)}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            {t("admin.payments.bookingToLink")}
          </label>
          <Input
            type="number"
            min={1}
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder={t("admin.payments.ticketIdPlaceholder")}
          />
        </div>

        <CheckboxField
          alignTop
          checked={allowAmountMismatch}
          onCheckedChange={setAllowAmountMismatch}
          label={t("admin.payments.allowMismatch")}
          description={t("admin.payments.allowMismatchHint")}
        />

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={allowAmountMismatch ? t("admin.payments.noteRequiredPlaceholder") : t("admin.payments.notePlaceholder")}
          className="resize-none"
        />
        {noteRequired && (
          <p className="-mt-2 text-xs text-destructive">{t("admin.payments.noteRequiredError")}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || idInvalid || noteRequired}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("admin.payments.confirmLink")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Tất toán giao dịch không gắn booking: đã trả người gửi hoặc bỏ qua. */
function ResolveDialog({ txn, onClose }: { txn: PaymentTransaction; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();
  const [resolution, setResolution] = useState<"RESOLVED_REFUNDED" | "RESOLVED_IGNORED">("RESOLVED_REFUNDED");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      adminService.resolvePaymentTransaction(txn.id, { resolution, note: note.trim() }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        type: "success",
        title: t("admin.payments.resolved"),
        description:
          resolution === "RESOLVED_REFUNDED"
            ? t("admin.payments.resolvedRefundDesc")
            : t("admin.payments.resolvedIgnoreDesc"),
      });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <Dialog open title={t("admin.payments.resolveDialogTitle", { id: txn.id })} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p>
            {t("admin.payments.amountReceived")} <span className="font-semibold text-foreground">{formatCurrency(txn.amount)}</span>
            {txn.ticketId ? <> · Vé #{txn.ticketId}</> : null}
          </p>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {t("admin.payments.transferNote")} {txn.rawDescription || "—"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">{t("admin.payments.outcome")}</label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as typeof resolution)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="RESOLVED_REFUNDED">{t("admin.payments.outcomeRefunded")}</SelectItem>
              <SelectItem value="RESOLVED_IGNORED">{t("admin.payments.outcomeIgnored")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t("admin.payments.resolveNotePlaceholder")}
          className="resize-none"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !note.trim()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("common.actions.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function AdminPaymentReconciliationPage() {
  const t = useTranslations();
  const [reconStatus, setReconStatus] = useState<string>("NEEDS_REVIEW");
  const [anomaly, setAnomaly] = useState<string>("");
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<{ txn: PaymentTransaction; kind: "apply" | "resolve" } | null>(null);

  const summary = useQuery({
    queryKey: [...QUERY_KEY, "summary"],
    queryFn: () => adminService.getReconciliationSummary(),
  });

  const query = useQuery({
    queryKey: [...QUERY_KEY, reconStatus, anomaly, page],
    queryFn: () =>
      adminService.listPaymentTransactions({
        reconStatus,
        anomaly: (anomaly || undefined) as PaymentTxnAnomaly | undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const items = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const totalElements = query.data?.totalElements ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.payments.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.payments.subtitle")}
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.payments.needsReview")}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {summary.data?.needsReviewCount ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.payments.total")} {summary.data ? formatCurrency(summary.data.needsReviewAmount) : "—"}
          </p>
        </div>
        {(summary.data?.byAnomaly ?? [])
          .filter((b) => b.anomaly)
          .map((b) => (
            <div key={b.anomaly} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(`admin.payments.anomaly.${b.anomaly!}`)}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{b.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(b.amount)}</p>
            </div>
          ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-52">
          <Select value={reconStatus} onValueChange={(v) => { setReconStatus(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("common.filters.allStatuses")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("common.filters.allStatuses")}</SelectItem>
              {RECON_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{t(`admin.payments.recon.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-52">
          <Select value={anomaly} onValueChange={(v) => { setAnomaly(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("admin.payments.allAnomalies")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("admin.payments.allAnomalies")}</SelectItem>
              {PAYMENT_ANOMALY_ORDER.map((a) => (
                <SelectItem key={a} value={a}>{t(`admin.payments.anomaly.${a}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <DataTable
          className="rounded-none"
          minWidth="56rem"
          rows={items}
          rowKey={(txn) => String(txn.id)}
          loading={query.isLoading}
          error={query.isError}
          errorTitle={t("admin.payments.loadError")}
          errorDescription={query.isError ? toErrorMessage(query.error) : undefined}
          onRetry={() => query.refetch()}
          emptyTitle={t("admin.payments.empty")}
          columns={[
            {
              // Bug S2-10: bấm tiêu đề cột để sắp xếp tăng/giảm dần.
              key: "txn",
              header: t("admin.payments.colTxn"),
              sortValue: (txn) => txn.id,
              cell: (txn) => (
                <>
                  <p className="font-medium text-foreground">#{txn.id}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{txn.externalId}</p>
                </>
              ),
            },
            {
              key: "amount",
              header: t("common.table.amount"),
              align: "right",
              sortValue: (txn) => txn.amount,
              cell: (txn) => (
                <>
                  <p className="font-semibold text-foreground">{formatCurrency(txn.amount)}</p>
                  {txn.amountDifference != null && txn.amountDifference !== 0 && (
                    <p
                      className={`text-[11px] ${txn.amountDifference > 0 ? "text-primary" : "text-warning"}`}
                    >
                      {txn.amountDifference > 0
                        ? `${t("admin.payments.over")} `
                        : `${t("admin.payments.under")} `}
                      {formatCurrency(Math.abs(txn.amountDifference))}
                    </p>
                  )}
                </>
              ),
            },
            {
              key: "note",
              header: t("admin.payments.colNote"),
              hideBelow: "lg",
              cell: (txn) => (
                <>
                  <TableEllipsis className="max-w-[15rem] text-muted-foreground" title={txn.rawDescription}>
                    {txn.rawDescription || "—"}
                  </TableEllipsis>
                  {txn.refCode && (
                    <p className="font-mono text-[11px] text-muted-foreground">{txn.refCode}</p>
                  )}
                </>
              ),
            },
            {
              key: "ticket",
              header: t("admin.payments.colTicket"),
              hideBelow: "md",
              cellClassName: "text-muted-foreground",
              cell: (txn) =>
                txn.ticketId ? (
                  <>
                    <p className="text-foreground">#{txn.ticketId}</p>
                    <p className="text-[11px]">{txn.customerUsername ?? "—"}</p>
                  </>
                ) : (
                  "—"
                ),
            },
            {
              key: "anomaly",
              header: t("admin.payments.colAnomaly"),
              hideBelow: "sm",
              cell: (txn) =>
                txn.anomaly ? (
                  <Badge
                    variant={ANOMALY_VARIANT[txn.anomaly]}
                    title={t(`admin.payments.hint.${txn.anomaly}`)}
                  >
                    {t(`admin.payments.anomaly.${txn.anomaly}`)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: "reconStatus",
              header: t("common.table.status"),
              sortValue: (txn) => txn.reconStatus,
              cell: (txn) => (
                <>
                  <Badge variant={RECON_VARIANT[txn.reconStatus]}>
                    {t(`admin.payments.recon.${txn.reconStatus}`)}
                  </Badge>
                  {txn.resolutionNote && (
                    <p className="mt-1 max-w-[200px] text-[11px] text-muted-foreground">
                      {txn.resolutionNote}
                      {txn.resolvedBy ? ` — ${txn.resolvedBy}` : ""}
                    </p>
                  )}
                </>
              ),
            },
            {
              key: "actions",
              header: t("common.table.actions"),
              align: "right",
              cell: (txn) =>
                txn.reconStatus === "NEEDS_REVIEW" ? (
                  <div className="flex justify-end gap-2">
                    {/* OVERPAID/DUPLICATE/LATE_ARRIVAL: booking không còn chờ tiền nên
                        BE sẽ chặn gắn — chỉ hiện nút cho ca gắn được. */}
                    {(txn.anomaly === "UNMATCHED" || txn.anomaly === "UNDERPAID") && (
                      <Button
                        className="h-8 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
                        onClick={() => setAction({ txn, kind: "apply" })}
                      >
                        {t("admin.payments.linkBooking")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => setAction({ txn, kind: "resolve" })}
                    >
                      {t("admin.payments.settle")}
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

      {action?.kind === "apply" && <ApplyDialog txn={action.txn} onClose={() => setAction(null)} />}
      {action?.kind === "resolve" && <ResolveDialog txn={action.txn} onClose={() => setAction(null)} />}
    </div>
  );
}
