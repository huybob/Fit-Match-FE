"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Plus, ReceiptText, WalletCards } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { Payment, PaymentStatus } from "@/services/payment.service";
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
import { useBookings } from "@/modules/booking/hooks/use-booking";
import { useCreatePayment, usePayments, useRefundPayment } from "../hooks/use-payment";
import { createPaymentSchema, refundSchema } from "../schemas";

const statuses: PaymentStatus[] = ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
const money = (value: number | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(value ?? 0);

const statusVariant: Partial<Record<PaymentStatus, React.ComponentProps<typeof Badge>["variant"]>> = {
  COMPLETED: "success",
  FAILED: "destructive",
  REFUNDED: "warning",
  PARTIALLY_REFUNDED: "warning",
  PENDING: "default",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Đang chờ",
  COMPLETED: "Hoàn thành",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
  PARTIALLY_REFUNDED: "Hoàn tiền một phần",
};

const paymentMethodLabels: Record<string, string> = {
  VNPAY: "VNPay",
  MOMO: "MoMo",
  BANK_TRANSFER: "Chuyển khoản",
  CASH: "Tiền mặt",
};

export function PaymentsPage({ scope }: { scope: "customer" | "pt" }) {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [creating, setCreating] = useState(false);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const query = usePayments(scope, status || undefined);
  const items = query.data?.content ?? [];
  const total = items.reduce((sum, p) => sum + (scope === "pt" ? (p.ptEarning ?? 0) : (p.amount ?? 0)), 0);

  return (
    <div>
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">
            {scope === "pt" ? "Lịch sử thu nhập" : "Lịch sử thanh toán"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {scope === "pt" ? "Xem lịch sử thu nhập từ các buổi tập của bạn." : "Xem lịch sử các giao dịch thanh toán của bạn."}
          </p>
        </div>
        {scope === "customer" && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />Tạo thanh toán
          </Button>
        )}
      </section>

      {!!items.length && (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <WalletCards className="size-7 text-primary" />
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">
              {scope === "pt" ? "Tổng thu nhập" : "Tổng thanh toán"}
            </p>
            <p className="text-2xl font-black">{money(total)}</p>
          </div>
        </div>
      )}

      <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus | "")}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tất cả trạng thái</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>{paymentStatusLabels[s] ?? s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title="Không thể tải dữ liệu" description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title="Chưa có thanh toán" description="Bạn chưa có giao dịch thanh toán nào." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((p) => (
              <article key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex justify-between">
                  <p className="text-xs font-black uppercase text-muted-foreground">#{p.id} · Booking #{p.bookingId}</p>
                  <Badge variant={p.status ? (statusVariant[p.status] ?? "default") : "default"}>
                    {p.status ? (paymentStatusLabels[p.status] ?? p.status) : "—"}
                  </Badge>
                </div>
                <h2 className="mt-2 text-xl font-black">
                  {money(scope === "pt" ? p.ptEarning : p.amount)}
                </h2>
                <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  <span>Khách hàng: {p.customerName}</span>
                  <span>Huấn luyện viên: {p.ptName}</span>
                  <span>Phương thức: {p.paymentMethod ? (paymentMethodLabels[p.paymentMethod] ?? p.paymentMethod) : "—"}</span>
                </div>
                {scope === "customer" && p.status === "COMPLETED" && (
                  <Button variant="destructive" className="mt-4" onClick={() => setRefunding(p)}>
                    Hoàn tiền
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <CreatePaymentDialog open={creating} onClose={() => setCreating(false)} />
      {refunding && <RefundDialog payment={refunding} onClose={() => setRefunding(null)} />}
    </div>
  );
}

function CreatePaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useCreatePayment();
  const confirmed = useBookings("customer", { status: "CONFIRMED", page: 0, size: 50 });
  const checkedIn = useBookings("customer", { status: "CHECKED_IN", page: 0, size: 50 });
  const payable = [...(confirmed.data?.content ?? []), ...(checkedIn.data?.content ?? [])];
  const loading = confirmed.isLoading || checkedIn.isLoading;
  const fmt = (v: number | undefined) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency", currency: "VND", maximumFractionDigits: 0,
    }).format(v ?? 0);

  const form = useForm<z.infer<typeof createPaymentSchema>>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: { bookingId: 0, paymentMethod: "VNPAY" },
  });

  return (
    <Dialog open={open} title="Tạo thanh toán" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync({ bookingId: v.bookingId, payload: { paymentMethod: v.paymentMethod } });
            toast({ type: "success", title: "Tạo thanh toán thành công" });
            onClose();
          } catch (e) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label="Booking" error={form.formState.errors.bookingId}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang xử lý...</p>
          ) : !payable.length ? (
            <p className="text-sm text-muted-foreground">Không có booking nào có thể thanh toán</p>
          ) : (
            <Controller
              control={form.control}
              name="bookingId"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {payable.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        #{b.id} · {b.ptServiceName ?? ""} · {b.bookingDate} · {fmt(b.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FieldShell>
        <FieldShell label="Phương thức thanh toán">
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["VNPAY", "MOMO", "BANK_TRANSFER", "CASH"].map((m) => (
                    <SelectItem key={m} value={m}>{paymentMethodLabels[m] ?? m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <CreditCard className="size-4" />Thanh toán
        </Button>
      </form>
    </Dialog>
  );
}

function RefundDialog({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useRefundPayment();
  const form = useForm<z.infer<typeof refundSchema>>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: payment.amount ?? 0, reason: "" },
  });

  return (
    <Dialog open title="Hoàn tiền" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync({ id: payment.id!, payload: v });
            toast({ type: "success", title: "Hoàn tiền thành công" });
            onClose();
          } catch (e) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
          }
        })}
      >
        <FieldShell label="Số tiền hoàn">
          <Input type="number" {...form.register("amount", { valueAsNumber: true })} />
        </FieldShell>
        <FieldShell label="Lý do hoàn tiền">
          <Textarea {...form.register("reason")} />
        </FieldShell>
        <Button variant="destructive" disabled={mutation.isPending}>
          <ReceiptText className="size-4" />Hoàn tiền
        </Button>
      </form>
    </Dialog>
  );
}
