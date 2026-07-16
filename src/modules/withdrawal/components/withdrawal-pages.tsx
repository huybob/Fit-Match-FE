"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Banknote, CheckCheck, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { Withdrawal, WithdrawalStatus } from "@/services/withdrawal.service";
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
  useWithdrawalDecision,
  useWithdrawals,
} from "../hooks/use-withdrawal";
import { createWithdrawalSchema } from "../schemas";

const VIETNAM_BANKS = [
  "Vietcombank", "VietinBank", "BIDV", "Agribank", "Techcombank",
  "MB Bank", "ACB", "VPBank", "Sacombank", "TPBank", "SHB", "HDBank",
  "VIB", "OCB", "Eximbank", "MSB", "SeABank", "LienVietPostBank",
  "ABBank", "Bac A Bank", "Nam A Bank", "PVcomBank", "SCB", "Saigonbank",
  "VietBank", "Cake by VPBank", "Timo",
] as const;

const statuses: WithdrawalStatus[] = ["PENDING", "APPROVED", "PAID", "REJECTED"];
const money = (value: number | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(value ?? 0);

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

function CreateWithdrawalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useCreateWithdrawal();
  const form = useForm<z.infer<typeof createWithdrawalSchema>>({
    resolver: zodResolver(createWithdrawalSchema),
    defaultValues: { amount: 0, bankName: "", bankAccount: "", accountHolder: "" },
  });

  return (
    <Dialog open={open} title="Tạo yêu cầu rút tiền" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
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
        <FieldShell label="Số tiền" error={form.formState.errors.amount}>
          <Input type="number" {...form.register("amount", { valueAsNumber: true })} />
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
  const meta = decisionLabels[decision];

  async function run() {
    if (meta.requireNote && !note.trim()) {
      toast({ type: "warning", title: "Vui lòng nhập lý do" });
      return;
    }
    try {
      await mutation.mutateAsync({ id: withdrawal.id, decision, note: note.trim() || undefined });
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
