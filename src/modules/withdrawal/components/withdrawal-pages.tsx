"use client";

import { formatCurrency } from "@/utils/format.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BadgeCheck, Banknote, CheckCheck, ChevronLeft, ChevronRight, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { Withdrawal, WithdrawalStatus } from "@/services/withdrawal.service";
import type { WalletTxnType } from "@/types/Withdrawal";
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
import {
  useCreateWithdrawal,
  useGymWallet,
  useGymWalletTransactions,
  useWithdrawalDecision,
  useWithdrawals,
} from "../hooks/use-withdrawal";
import { createWithdrawalSchema } from "../schemas";

/** Nhãn tiếng Việt cho WalletTxnType (D-3). */
const TXN_LABELS: Record<WalletTxnType, string> = {
  HOLD: "Giữ tiền booking (escrow)",
  REFUND: "Hoàn tiền cho khách",
  MOVE_TO_PENDING: "Chuyển sang chờ giải ngân",
  RELEASE: "Giải ngân về khả dụng",
  COMMISSION: "Hoa hồng nền tảng",
  FREEZE: "Đóng băng",
  UNFREEZE: "Gỡ đóng băng",
  WITHDRAWAL: "Chi trả rút tiền",
  DISPUTE_HOLD: "Giữ lại do tranh chấp",
};

import { VIETNAM_BANKS } from "@/shared/constants/banks.constant";

const statuses: WithdrawalStatus[] = ["PENDING", "APPROVED", "PAID", "REJECTED"];
// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

const statusVariant: Record<WithdrawalStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  PAID: "success",
};

const withdrawalStatusLabels: Record<WithdrawalStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt — chờ chi",
  REJECTED: "Đã từ chối",
  PAID: "Đã chi trả",
};

const scopeTitles: Record<"gym" | "admin", string> = {
  gym: "Ví & rút tiền",
  admin: "Quản lý rút tiền",
};

const scopeDescriptions: Record<"gym" | "admin", string> = {
  gym: "Theo dõi số dư và gửi yêu cầu rút tiền về tài khoản ngân hàng của phòng gym.",
  admin: "Duyệt, từ chối và xác nhận chi trả các yêu cầu rút tiền của phòng gym.",
};

export function WithdrawalsPage({ scope }: { scope: "gym" | "admin" }) {
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [creating, setCreating] = useState(false);
  const [deciding, setDeciding] = useState<{ withdrawal: Withdrawal; decision: "approve" | "reject" | "markPaid" } | null>(null);
  const query = useWithdrawals(scope, status || undefined);
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{scopeTitles[scope]}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{scopeDescriptions[scope]}</p>
        </div>
        {scope === "gym" && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Tạo yêu cầu rút tiền
          </Button>
        )}
      </section>

      {scope === "gym" && <WalletSummary />}
      {scope === "gym" && <WalletLedger />}

      <Select value={status} onValueChange={(v) => setStatus(v as WithdrawalStatus | "")}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tất cả trạng thái</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>{withdrawalStatusLabels[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title="Lỗi tải dữ liệu" description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title="Chưa có yêu cầu rút tiền" description="Các yêu cầu rút tiền sẽ hiển thị tại đây." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((w) => (
              <article key={w.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-muted-foreground">#{w.id}</p>
                  <Badge variant={statusVariant[w.status]}>
                    {withdrawalStatusLabels[w.status]}
                  </Badge>
                </div>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
                  <Banknote className="size-6 text-primary" />
                  {money(w.amount)}
                </h2>
                <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {scope === "admin" && w.requestedBy && <span>Người yêu cầu: {w.requestedBy}</span>}
                  <span>Ngân hàng: {w.bankName}</span>
                  <span>Số tài khoản: {w.bankAccount}</span>
                  <span>Chủ tài khoản: {w.accountHolder}</span>
                  {w.reviewNote && (
                    <span className={w.status === "REJECTED" ? "text-destructive" : "text-emerald-600"}>
                      Ghi chú xử lý: {w.reviewNote}
                    </span>
                  )}
                  {w.payoutReference && (
                    <span className="text-emerald-600">Mã giao dịch chi trả: {w.payoutReference}</span>
                  )}
                </div>
                {scope === "admin" && w.status === "PENDING" && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setDeciding({ withdrawal: w, decision: "approve" })}>
                      <BadgeCheck className="size-4" />Duyệt
                    </Button>
                    <Button variant="destructive" onClick={() => setDeciding({ withdrawal: w, decision: "reject" })}>
                      <XCircle className="size-4" />Từ chối
                    </Button>
                  </div>
                )}
                {scope === "admin" && w.status === "APPROVED" && (
                  <div className="mt-4">
                    <Button onClick={() => setDeciding({ withdrawal: w, decision: "markPaid" })}>
                      <CheckCheck className="size-4" />Đã chuyển khoản
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {scope === "gym" && <CreateWithdrawalDialog open={creating} onClose={() => setCreating(false)} />}
      {deciding && (
        <DecisionDialog
          withdrawal={deciding.withdrawal}
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
        />
      )}
    </div>
  );
}

/** UC-061: số dư 4 bucket của ví gym. */
function WalletSummary() {
  const wallet = useGymWallet();

  // D-16: lỗi API ví trước đây bị che thành 0đ (`?? 0`) — hiện lỗi rõ ràng thay vì số sai.
  if (wallet.isError) {
    return (
      <section className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-700">Không tải được số dư ví</p>
          <p className="text-xs text-red-600">{toErrorMessage(wallet.error)}</p>
        </div>
      </section>
    );
  }

  const buckets: Array<{ key: string; label: string; value?: number; hint: string }> = [
    { key: "held", label: "Đang giữ (escrow)", value: wallet.data?.heldBalance, hint: "Tiền booking chưa hoàn tất" },
    { key: "pending", label: "Chờ giải ngân", value: wallet.data?.pendingBalance, hint: "Đã hoàn tất, chờ hết kỳ đối soát" },
    { key: "available", label: "Khả dụng", value: wallet.data?.availableBalance, hint: "Có thể rút" },
    { key: "frozen", label: "Đóng băng", value: wallet.data?.frozenBalance, hint: "Dispute / lệnh rút đang xử lý" },
  ];
  return (
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {buckets.map((b) => (
        <div key={b.key} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{b.label}</p>
          <p className="mt-1 text-xl font-black">{wallet.isLoading ? "…" : money(b.value)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{b.hint}</p>
        </div>
      ))}
    </section>
  );
}

/** D-3 (UC-061): sổ cái ví — trước đây hook tồn tại nhưng không component nào render. */
function WalletLedger() {
  const [page, setPage] = useState(0);
  const query = useGymWalletTransactions(page);
  const items = query.data?.content ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const totalElements = query.data?.totalElements ?? 0;

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Lịch sử giao dịch ví</h2>
      </div>
      {query.isLoading ? (
        <div className="p-5"><LoadingSkeleton /></div>
      ) : query.isError ? (
        <div className="p-5"><EmptyState title="Lỗi tải sổ cái" description={toErrorMessage(query.error)} /></div>
      ) : !items.length ? (
        <p className="p-5 text-sm text-muted-foreground">Chưa có giao dịch nào.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5">Thời gian</th>
                  <th className="px-4 py-2.5">Loại</th>
                  <th className="px-4 py-2.5 text-right">Số tiền</th>
                  <th className="px-4 py-2.5">Booking</th>
                  <th className="px-4 py-2.5 text-right">Giữ</th>
                  <th className="px-4 py-2.5 text-right">Chờ</th>
                  <th className="px-4 py-2.5 text-right">Khả dụng</th>
                  <th className="px-4 py-2.5 text-right">Băng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">
                      {t.createdAt ? new Date(t.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-foreground">
                      {TXN_LABELS[t.type as WalletTxnType] ?? t.type}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">{money(t.amount)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.bookingId ? `#${t.bookingId}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{money(t.heldAfter)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{money(t.pendingAfter)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{money(t.availableAfter)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{money(t.frozenAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Trang {page + 1}/{Math.max(totalPages, 1)} · {totalElements.toLocaleString("vi-VN")} giao dịch
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-8 px-3 text-xs" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
                <ChevronLeft className="size-3.5" /> Trước
              </Button>
              <Button variant="outline" className="h-8 px-3 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((v) => v + 1)}>
                Sau <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function CreateWithdrawalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useCreateWithdrawal();
  const wallet = useGymWallet();
  const available = wallet.data?.availableBalance ?? 0;
  const form = useForm<z.infer<typeof createWithdrawalSchema>>({
    resolver: zodResolver(createWithdrawalSchema),
    defaultValues: { amount: 0, bankName: "", bankAccount: "", accountHolder: "" },
  });

  return (
    <Dialog open={open} title="Tạo yêu cầu rút tiền" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          // D-9: chặn vượt khả dụng ngay tại client (BE vẫn là chốt cuối).
          if (v.amount > available) {
            form.setError("amount", {
              message: `Vượt số dư khả dụng (${money(available)})`,
            });
            return;
          }
          try {
            await mutation.mutateAsync(v);
            toast({ type: "success", title: "Đã tạo yêu cầu rút tiền", description: "Số tiền được giữ chỗ chờ duyệt." });
            form.reset();
            onClose();
          } catch (e) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label={`Số tiền (khả dụng: ${money(available)})`} error={form.formState.errors.amount}>
          <Input type="number" min={10000} max={available} step={1000} {...form.register("amount", { valueAsNumber: true })} />
        </FieldShell>
        <FieldShell label="Ngân hàng" error={form.formState.errors.bankName}>
          <Controller
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {VIETNAM_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
        <FieldShell label="Số tài khoản" error={form.formState.errors.bankAccount}>
          <Input {...form.register("bankAccount")} />
        </FieldShell>
        <FieldShell label="Chủ tài khoản" error={form.formState.errors.accountHolder}>
          <Input {...form.register("accountHolder")} />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <Banknote className="size-4" />
          {mutation.isPending ? "Đang xử lý..." : "Gửi yêu cầu"}
        </Button>
      </form>
    </Dialog>
  );
}

const decisionLabels = {
  approve: { title: "Duyệt yêu cầu rút tiền", confirm: "Duyệt", requireNote: false },
  reject: { title: "Từ chối yêu cầu rút tiền", confirm: "Từ chối", requireNote: true },
  markPaid: { title: "Xác nhận đã chuyển khoản", confirm: "Đã chuyển khoản", requireNote: false },
} as const;

function DecisionDialog({ withdrawal, decision, onClose }: {
  withdrawal: Withdrawal;
  decision: "approve" | "reject" | "markPaid";
  onClose: () => void;
}) {
  const { toast } = useToast();
  const mutation = useWithdrawalDecision();
  const [note, setNote] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const meta = decisionLabels[decision];

  async function run() {
    if (meta.requireNote && !note.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập lý do" });
      return;
    }
    if (decision === "markPaid" && !payoutReference.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập mã giao dịch chuyển khoản" });
      return;
    }
    try {
      await mutation.mutateAsync({
        id: withdrawal.id,
        decision,
        note: note.trim() || undefined,
        payoutReference: payoutReference.trim() || undefined,
      });
      toast({ type: "success", title: meta.title + " thành công" });
      onClose();
    } catch (e) {
      toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
    }
  }

  return (
    <Dialog open title={meta.title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        #{withdrawal.id} · {money(withdrawal.amount)} · {withdrawal.bankName} — {withdrawal.bankAccount} ({withdrawal.accountHolder})
      </p>
      {decision === "markPaid" && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Mã giao dịch chuyển khoản <span className="text-red-500">*</span>
          </label>
          <Input
            value={payoutReference}
            maxLength={100}
            onChange={(e) => setPayoutReference(e.target.value)}
            placeholder="VD: FT2026071712345 (từ sao kê ngân hàng)"
          />
        </div>
      )}
      <Textarea
        className="mt-4"
        maxLength={500}
        placeholder={meta.requireNote ? "Lý do (bắt buộc)" : "Ghi chú (không bắt buộc)"}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-4 flex gap-2">
        <Button
          variant={decision === "reject" ? "destructive" : "default"}
          disabled={mutation.isPending}
          onClick={() => void run()}
        >
          {mutation.isPending ? "Đang xử lý..." : meta.confirm}
        </Button>
        <Button variant="outline" onClick={onClose}>Hủy</Button>
      </div>
    </Dialog>
  );
}
