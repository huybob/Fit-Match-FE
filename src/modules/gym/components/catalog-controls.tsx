"use client";

// Gói 2.C (audit 2026-07-17): điều khiển chung cho catalog service/package —
// B-23 (UC-026): dialog quy tắc đặt lịch; B-24 (UC-027): trạng thái PUBLISHED/HIDDEN/PAUSED/ARCHIVED.

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import type { BookingRules, CatalogStatus } from "@/types/Gym";

export const CATALOG_STATUS_LABEL: Record<CatalogStatus, string> = {
  PUBLISHED: "Đang bán",
  HIDDEN: "Đang ẩn",
  PAUSED: "Tạm ngưng",
  ARCHIVED: "Đã lưu trữ",
};

export const CATALOG_STATUS_STYLE: Record<CatalogStatus, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  HIDDEN: "bg-muted text-muted-foreground",
  PAUSED: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-red-100 text-red-600",
};

/** Các chuyển trạng thái hợp lệ (ARCHIVED là trạng thái cuối — khớp BE). */
const NEXT_STATUSES: Record<CatalogStatus, CatalogStatus[]> = {
  PUBLISHED: ["HIDDEN", "PAUSED", "ARCHIVED"],
  HIDDEN: ["PUBLISHED", "PAUSED", "ARCHIVED"],
  PAUSED: ["PUBLISHED", "HIDDEN", "ARCHIVED"],
  ARCHIVED: [],
};

export function CatalogStatusBadge({ status }: { status?: CatalogStatus }) {
  const s = status ?? "HIDDEN";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${CATALOG_STATUS_STYLE[s]}`}>
      {CATALOG_STATUS_LABEL[s]}
    </span>
  );
}

/** Menu đổi trạng thái catalog (UC-027). ARCHIVED có xác nhận vì không đảo ngược được. */
export function CatalogStatusMenu({
  status,
  onChange,
  pending,
}: {
  status?: CatalogStatus;
  onChange: (next: CatalogStatus) => void;
  pending?: boolean;
}) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const options = NEXT_STATUSES[status ?? "HIDDEN"];
  if (!options.length) return null;

  return (
    <>
      <select
        value=""
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as CatalogStatus;
          if (!next) return;
          if (next === "ARCHIVED") setConfirmArchive(true);
          else onChange(next);
        }}
        className="h-7 rounded-lg border border-border bg-card px-2 text-[11px] font-semibold text-muted-foreground"
      >
        <option value="">Đổi trạng thái…</option>
        {options.map((s) => (
          <option key={s} value={s}>{CATALOG_STATUS_LABEL[s]}</option>
        ))}
      </select>

      <Dialog open={confirmArchive} title="Lưu trữ vĩnh viễn?" onClose={() => setConfirmArchive(false)}>
        <p className="text-sm text-muted-foreground">
          Mục đã lưu trữ KHÔNG thể chuyển sang trạng thái khác (trạng thái cuối). Bạn có chắc chắn?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmArchive(false)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
          <Button
            onClick={() => { setConfirmArchive(false); onChange("ARCHIVED"); }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Lưu trữ vĩnh viễn
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** UC-026: quy tắc đặt lịch — cọc %, giờ hủy miễn phí, giờ đặt trước tối thiểu. */
export function BookingRulesDialog({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial?: BookingRules;
  onSave: (rules: BookingRules) => Promise<unknown>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [deposit, setDeposit] = useState(initial?.depositPercent != null ? String(initial.depositPercent) : "");
  const [freeCancel, setFreeCancel] = useState(initial?.freeCancellationHours != null ? String(initial.freeCancellationHours) : "");
  const [minNotice, setMinNotice] = useState(initial?.minNoticeHours != null ? String(initial.minNoticeHours) : "");

  const mutation = useMutation({
    mutationFn: () =>
      onSave({
        depositPercent: deposit ? Number(deposit) : null,
        freeCancellationHours: freeCancel ? Number(freeCancel) : null,
        minNoticeHours: minNotice ? Number(minNotice) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-services"] });
      qc.invalidateQueries({ queryKey: ["gym-packages"] });
      toast({ type: "success", title: "Đã lưu quy tắc đặt lịch" });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  const depositInvalid = deposit !== "" && (Number(deposit) < 0 || Number(deposit) > 100);

  return (
    <Dialog open title={title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Đặt cọc (%) — trống = thanh toán đủ</label>
          <Input type="number" min={0} max={100} value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Vd: 30" />
          {depositInvalid && <p className="mt-1 text-xs text-red-500">Phải trong khoảng 0–100.</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Hủy miễn phí trước (giờ)</label>
          <Input type="number" min={0} value={freeCancel} onChange={(e) => setFreeCancel(e.target.value)} placeholder="Vd: 24 — hủy muộn hơn sẽ tính phí" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Phải đặt trước tối thiểu (giờ)</label>
          <Input type="number" min={0} value={minNotice} onChange={(e) => setMinNotice(e.target.value)} placeholder="Vd: 2" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={depositInvalid || mutation.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />} Lưu quy tắc
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
