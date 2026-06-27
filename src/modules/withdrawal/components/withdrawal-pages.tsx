"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Banknote, Plus, XCircle } from "lucide-react";
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
  useApproveWithdrawal,
  useCreateWithdrawal,
  useRejectWithdrawal,
  useWithdrawals,
} from "../hooks/use-withdrawal";
import { createWithdrawalSchema, rejectWithdrawalSchema } from "../schemas";

const VIETNAM_BANKS = [
  "Vietcombank", "VietinBank", "BIDV", "Agribank", "Techcombank",
  "MB Bank", "ACB", "VPBank", "Sacombank", "TPBank", "SHB", "HDBank",
  "VIB", "OCB", "Eximbank", "MSB", "SeABank", "LienVietPostBank",
  "ABBank", "Bac A Bank", "Nam A Bank", "PVcomBank", "SCB", "Saigonbank",
  "VietBank", "Cake by VPBank", "Timo",
] as const;

const statuses: WithdrawalStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const money = (value: number | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(value ?? 0);

const statusVariant: Record<WithdrawalStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const withdrawalStatusLabels: Record<WithdrawalStatus, string> = {
  PENDING: "Đang chờ",
  APPROVED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
};

const scopeTitles: Record<"pt" | "admin", string> = {
  pt: "Yêu cầu rút tiền",
  admin: "Quản lý rút tiền",
};

const scopeDescriptions: Record<"pt" | "admin", string> = {
  pt: "Gửi yêu cầu rút tiền về tài khoản ngân hàng của bạn.",
  admin: "Xem và xử lý các yêu cầu rút tiền của huấn luyện viên.",
};

export function WithdrawalsPage({ scope }: { scope: "pt" | "admin" }) {
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
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
        {scope === "pt" && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Tạo yêu cầu rút tiền
          </Button>
        )}
      </section>

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
                  <Badge variant={w.status ? statusVariant[w.status] : "default"}>
                    {w.status ? withdrawalStatusLabels[w.status] : "—"}
                  </Badge>
                </div>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
                  <Banknote className="size-6 text-primary" />
                  {money(w.amount)}
                </h2>
                <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {scope === "admin" && <span>Huấn luyện viên: {w.ptName}</span>}
                  <span>Ngân hàng: {w.bankName}</span>
                  <span>Số tài khoản: {w.bankAccount}</span>
                  <span>Chủ tài khoản: {w.bankHolder}</span>
                  {w.notes && <span>Ghi chú: {w.notes}</span>}
                  {w.status === "REJECTED" && w.rejectionReason && (
                    <span className="text-destructive">Lý do từ chối: {w.rejectionReason}</span>
                  )}
                  {w.status === "APPROVED" && w.approvedByName && (
                    <span className="text-emerald-600">Được duyệt bởi: {w.approvedByName}</span>
                  )}
                </div>
                {scope === "admin" && w.status === "PENDING" && (
                  <div className="mt-4 flex gap-2">
                    <ApproveButton id={w.id!} />
                    <Button variant="destructive" onClick={() => setRejecting(w)}>
                      <XCircle className="size-4" />
                      Từ chối
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <CreateWithdrawalDialog open={creating} onClose={() => setCreating(false)} />
      {rejecting && <RejectDialog withdrawal={rejecting} onClose={() => setRejecting(null)} />}
    </div>
  );
}

function ApproveButton({ id }: { id: number }) {
  const { toast } = useToast();
  const mutation = useApproveWithdrawal();
  return (
    <Button
      disabled={mutation.isPending}
      onClick={async () => {
        try {
          await mutation.mutateAsync(id);
          toast({ type: "success", title: "Đã duyệt yêu cầu" });
        } catch (e) {
          toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
        }
      }}
    >
      <BadgeCheck className="size-4" />
      Duyệt
    </Button>
  );
}

function CreateWithdrawalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useCreateWithdrawal();
  const form = useForm<z.infer<typeof createWithdrawalSchema>>({
    resolver: zodResolver(createWithdrawalSchema),
    defaultValues: { amount: 0, bankName: "", bankAccount: "", bankHolder: "", notes: "" },
  });

  return (
    <Dialog open={open} title="Tạo yêu cầu rút tiền" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync(v);
            toast({ type: "success", title: "Đã tạo yêu cầu rút tiền" });
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
        <FieldShell label="Chủ tài khoản" error={form.formState.errors.bankHolder}>
          <Input {...form.register("bankHolder")} />
        </FieldShell>
        <FieldShell label="Ghi chú" error={form.formState.errors.notes}>
          <Textarea {...form.register("notes")} />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <Banknote className="size-4" />
          Gửi yêu cầu
        </Button>
      </form>
    </Dialog>
  );
}

function RejectDialog({ withdrawal, onClose }: { withdrawal: Withdrawal; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useRejectWithdrawal();
  const form = useForm<z.infer<typeof rejectWithdrawalSchema>>({
    resolver: zodResolver(rejectWithdrawalSchema),
    defaultValues: { reason: "" },
  });

  return (
    <Dialog open title="Từ chối" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync({ id: withdrawal.id!, payload: v });
            toast({ type: "success", title: "Đã từ chối yêu cầu" });
            onClose();
          } catch (e) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label="Lý do từ chối" error={form.formState.errors.reason}>
          <Textarea {...form.register("reason")} />
        </FieldShell>
        <Button variant="destructive" disabled={mutation.isPending}>
          <XCircle className="size-4" />
          Từ chối
        </Button>
      </form>
    </Dialog>
  );
}
