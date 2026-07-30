"use client";

import { formatCurrency } from "@/utils/format.util";
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
import { getErrorStatus, toErrorMessage } from "@/shared/utils/error.util";
import { DateTimePicker } from "@/shared/components/ui/date-time-picker";
import { useTranslations } from "next-intl";

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

export default function AdminVouchersRoute() {
  const t = useTranslations();
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "vouchers"], queryFn: () => voucherService.list() });
  const [editing, setEditing] = useState<Voucher | null | undefined>();
  const items = query.data?.content ?? [];

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => voucherService.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "vouchers"] }),
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{t("admin.vouchers.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.vouchers.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing(null)}><Plus className="size-4" /> {t("admin.vouchers.create")}</Button>
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("common.states.errorTitle")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("admin.vouchers.emptyTitle")} description={t("admin.vouchers.emptyDescription")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((v) => (
            <article key={v.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-lg font-black"><Tag className="size-4 text-accent" />{v.code}</span>
                <Badge variant={v.active ? "success" : "default"}>{v.active ? t("common.states.enabled") : t("common.states.disabledState")}</Badge>
              </div>
              {v.description && <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>}
              <p className="mt-3 text-sm">
                {t("admin.vouchers.discount")}: <b>{v.discountType === "PERCENT" ? `${v.discountValue}%` : money(v.discountValue)}</b>
                {v.maxDiscount ? ` (${t("admin.vouchers.maxDiscountShort", { max: money(v.maxDiscount) })})` : ""}
                {v.minBookingAmount ? ` · ${t("admin.vouchers.minOrderShort", { min: money(v.minBookingAmount) })}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.usageLimit
                  ? t("admin.vouchers.usedCountOf", { used: v.usedCount ?? 0, limit: v.usageLimit })
                  : t("admin.vouchers.usedCount", { used: v.usedCount ?? 0 })}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setEditing(v)}>{t("common.actions.edit")}</Button>
                <Button variant="ghost" onClick={() => toggle.mutate({ id: v.id, active: !v.active })}>
                  {v.active ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                  {v.active ? t("common.states.off") : t("common.states.on")}
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
  const t = useTranslations();
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
    // E-11 (audit 2026-07-17): thời hạn hiệu lực — FE type/BE DTO/DB đều hỗ trợ
    // nhưng form thiếu input → voucher hiệu lực vô hạn ngoài ý muốn.
    validFrom: voucher?.validFrom?.slice(0, 16),
    validTo: voucher?.validTo?.slice(0, 16),
    active: voucher?.active ?? true,
  });

  // BUG-05: chỉ có toast là không đủ — toast tự tắt sau ~4s trong khi dialog vẫn
  // mở, người dùng quay lại nhìn thì không còn manh mối nào về việc lưu hỏng.
  // Giữ thêm một dòng lỗi cố định ngay trong dialog cho tới lần lưu kế tiếp.
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => (voucher ? voucherService.update(voucher.id, form) : voucherService.create(form)),
    onMutate: () => setSaveError(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      toast({ type: "success", title: voucher ? t("admin.vouchers.updated") : t("admin.vouchers.created") });
      onClose();
    },
    onError: (e) => {
      // BE trả nguyên văn tiếng Anh ("Voucher code already exists") — dịch trường
      // hợp đã biết thay vì đổ thẳng text nội bộ ra cho người dùng cuối.
      const message =
        getErrorStatus(e) === 409 ? t("admin.vouchers.codeExists") : toErrorMessage(e);
      setSaveError(message);
      toast({ type: "error", title: t("common.states.failed"), description: message });
    },
  });

  const set = (patch: Partial<VoucherRequest>) => setForm((f) => ({ ...f, ...patch }));
  const num = (s: string) => (s === "" ? undefined : Number(s));

  return (
    <Dialog open title={voucher ? t("admin.vouchers.editTitle") : t("admin.vouchers.create")} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground sm:col-span-2">
          {t("admin.vouchers.fieldCode")} <Input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground sm:col-span-2">{t("common.table.description")}<Input value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.vouchers.fieldType")}
          <Select value={form.discountType} onValueChange={(v) => set({ discountType: v as DiscountType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">{t("admin.vouchers.typePercent")}</SelectItem>
              <SelectItem value="FIXED">{t("admin.vouchers.typeFixed")}</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.vouchers.fieldValue")} <Input type="number" value={form.discountValue} onChange={(e) => set({ discountValue: Number(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.vouchers.fieldMinBooking")} <Input type="number" value={form.minBookingAmount ?? ""} onChange={(e) => set({ minBookingAmount: num(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.vouchers.fieldMaxDiscount")} <Input type="number" value={form.maxDiscount ?? ""} onChange={(e) => set({ maxDiscount: num(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground sm:col-span-2">
          {t("admin.vouchers.fieldUsageLimit")} <Input type="number" value={form.usageLimit ?? ""} onChange={(e) => set({ usageLimit: num(e.target.value) })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.vouchers.validFrom")}
          <DateTimePicker value={form.validFrom ?? ""}
            onChange={(v) => set({ validFrom: v || undefined })} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase text-muted-foreground">
          {t("admin.vouchers.validTo")}
          <DateTimePicker value={form.validTo ?? ""}
            onChange={(v) => set({ validTo: v || undefined })} />
        </label>
        {form.validFrom && form.validTo && form.validFrom >= form.validTo && (
          <p className="sm:col-span-2 text-xs text-destructive">{t("admin.vouchers.rangeInvalid")}</p>
        )}
      </div>
      {saveError && (
        <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {saveError}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button
          disabled={save.isPending || !form.code.trim() || (!!form.validFrom && !!form.validTo && form.validFrom >= form.validTo)}
          onClick={() => save.mutate()}
        >{t("common.actions.save")}</Button>
        <Button variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
      </div>
    </Dialog>
  );
}
