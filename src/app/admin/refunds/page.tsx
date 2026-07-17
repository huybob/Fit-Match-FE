"use client";

// D-2 (audit 2026-07-17, UC-056): trước đây KHÔNG có màn admin duyệt refund —
// tiền khách treo REFUND_PENDING không ai xử lý được qua UI dù BE hoàn chỉnh.

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
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

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<RefundStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  EXECUTED: "Đã hoàn",
};

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
        title: decision === "approve" ? "Đã hoàn tiền (bút toán ví ghi ngay)" : "Đã từ chối yêu cầu",
        description:
          decision === "approve"
            ? "Chuyển khoản thực tế cho khách thực hiện thủ công theo record này."
            : "Tiền trở lại trạng thái giữ (HELD) của booking.",
      });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  const amountInvalid =
    partial &&
    (!approvedAmount || Number(approvedAmount) <= 0 || Number(approvedAmount) > refund.amount);

  return (
    <Dialog
      open
      title={decision === "approve" ? `Duyệt hoàn tiền #${refund.id}` : `Từ chối hoàn tiền #${refund.id}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Booking #{refund.bookingId} · Số tiền yêu cầu: <span className="font-semibold text-foreground">{formatCurrency(refund.amount)}</span>
          {refund.reason ? <> · Lý do: {refund.reason}</> : null}
        </p>

        {decision === "approve" && (
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} className="size-4 accent-primary" />
              Hoàn một phần (phần còn lại là phí Gym giữ, vào chờ giải ngân)
            </label>
            {partial && (
              <div>
                <Input
                  type="number"
                  min={1}
                  max={refund.amount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  placeholder={`Tối đa ${formatCurrency(refund.amount)}`}
                />
                {amountInvalid && (
                  <p className="mt-1 text-xs text-red-500">Số tiền phải trong khoảng 1 – {formatCurrency(refund.amount)}</p>
                )}
              </div>
            )}
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Ghi chú quyết định..."
          className="w-full resize-none rounded-lg border border-border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || amountInvalid}
            className={`gap-2 text-white ${decision === "approve" ? "bg-primary hover:bg-primary/90" : "bg-red-600 hover:bg-red-700"}`}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {decision === "approve" ? "Xác nhận hoàn tiền" : "Xác nhận từ chối"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function AdminRefundsPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Duyệt hoàn tiền</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hoàn toàn bộ hoặc một phần tiền đang giữ của booking; bút toán ví ghi ngay, chuyển khoản thực tế làm thủ công.
          </p>
        </div>
        <div className="w-44">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả trạng thái</SelectItem>
              {(Object.keys(STATUS_LABEL) as RefundStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Mã</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Người yêu cầu</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : query.isError ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-red-500">{toErrorMessage(query.error)}</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">Không có yêu cầu hoàn tiền nào</td></tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium text-foreground">#{r.id}</td>
                    <td className="px-4 py-3 text-foreground">#{r.bookingId}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(r.amount)}</td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground" title={r.reason}>{r.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.requestedBy ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      {r.decisionNote && <p className="mt-1 text-[11px] text-muted-foreground">{r.decisionNote}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button className="h-8 bg-primary px-3 text-xs text-white hover:bg-primary/90"
                            onClick={() => setAction({ refund: r, decision: "approve" })}>
                            Duyệt
                          </Button>
                          <Button variant="outline" className="h-8 px-3 text-xs text-red-600"
                            onClick={() => setAction({ refund: r, decision: "reject" })}>
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {totalElements > 0
              ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalElements)} / ${totalElements.toLocaleString("vi-VN")} yêu cầu`
              : "Không có dữ liệu"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 gap-1 px-3 text-xs" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
              <ChevronLeft className="size-3.5" /> Trước
            </Button>
            <Button variant="outline" className="h-8 gap-1 px-3 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((v) => v + 1)}>
              Sau <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {action && <DecisionDialog refund={action.refund} decision={action.decision} onClose={() => setAction(null)} />}
    </div>
  );
}
