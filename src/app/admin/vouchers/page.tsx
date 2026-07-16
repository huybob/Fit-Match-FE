"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import { voucherService, type DiscountType, type Voucher, type VoucherRequest } from "@/services/voucher.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";

const money = (v?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v ?? 0);

export default function AdminVouchersRoute() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "vouchers"], queryFn: () => voucherService.list() });
  const [editing, setEditing] = useState<Voucher | null | undefined>();
  const items = query.data?.content ?? [];

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => voucherService.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "vouchers"] }),
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">Voucher / Khuyến mãi</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cấu hình mã giảm giá áp dụng khi khách đặt lịch (UC-073).</p>
        </div>
        <Button onClick={() => setEditing(null)}><Plus className="size-4" /> Tạo voucher</Button>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có voucher" description="Tạo voucher đầu tiên để chạy khuyến mãi." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((v) => (
            <article key={v.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-lg font-black"><Tag className="size-4 text-accent" />{v.code}</span>
                <Badge variant={v.active ? "success" : "default"}>{v.active ? "Đang bật" : "Đã tắt"}</Badge>
              </div>
              {v.description && <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>}
              <p className="mt-3 text-sm">
                Giảm: <b>{v.discountType === "PERCENT" ? `${v.discountValue}%` : money(v.discountValue)}</b>
                {v.maxDiscount ? ` (tối đa ${money(v.maxDiscount)})` : ""}
                {v.minBookingAmount ? ` · đơn tối thiểu ${money(v.minBookingAmount)}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Đã dùng {v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ""} lượt
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setEditing(v)}>Sửa</Button>
                <Button variant="ghost" onClick={() => toggle.mutate({ id: v.id, active: !v.active })}>
                  {v.active ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                  {v.active ? "Tắt" : "Bật"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing !== undefined && <VoucherDialog voucher={editing} onClose={() => setEditing(undefined)} />}
    </main>
  );
}

function VoucherDialog({ voucher, onClose }: { voucher: Voucher | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<VoucherRequest>({
    code: voucher?.code ?? "",
    description: voucher?.description ?? "",
    discountType: voucher?.discountType ?? "PERCENT",
    discountValue: voucher?.discountValue ?? 10,
    minBookingAmount: voucher?.minBookingAmount,
    maxDiscount: voucher?.maxDiscount,
    usageLimit: voucher?.usageLimit,
    active: voucher?.active ?? true,
  });

  const save = useMutation({
    mutationFn: () => (voucher ? voucherService.update(voucher.id, form) : voucherService.create(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      toast({ type: "success", title: voucher ? "Đã cập nhật voucher" : "Đã tạo voucher" });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) }),
  });

  const set = (patch: Partial<VoucherRequest>) => setForm((f) => ({ ...f, ...patch }));
  const num = (s: string) => (s === "" ? undefined : Number(s));

  return (
    <Dialog open title={voucher ? "Sửa voucher" : "Tạo voucher"} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground sm:col-span-2">
          Mã <Input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground sm:col-span-2">
          Mô tả <Input value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Loại
          <Select value={form.discountType} onValueChange={(v) => set({ discountType: v as DiscountType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
              <SelectItem value="FIXED">Số tiền cố định</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Giá trị <Input type="number" value={form.discountValue} onChange={(e) => set({ discountValue: Number(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Đơn tối thiểu <Input type="number" value={form.minBookingAmount ?? ""} onChange={(e) => set({ minBookingAmount: num(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          Giảm tối đa (cho %) <Input type="number" value={form.maxDiscount ?? ""} onChange={(e) => set({ maxDiscount: num(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground sm:col-span-2">
          Giới hạn lượt (bỏ trống = không giới hạn) <Input type="number" value={form.usageLimit ?? ""} onChange={(e) => set({ usageLimit: num(e.target.value) })} />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={save.isPending || !form.code.trim()} onClick={() => save.mutate()}>Lưu</Button>
        <Button variant="outline" onClick={onClose}>Hủy</Button>
      </div>
    </Dialog>
  );
}
