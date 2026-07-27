"use client";

// Gói 2.C (audit 2026-07-17): điều khiển chung cho catalog service/package —
// B-23 (UC-026): dialog quy tắc đặt lịch; B-24 (UC-027): trạng thái PUBLISHED/HIDDEN/PAUSED/ARCHIVED.

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn.util";
import type { BookingRules, CatalogStatus } from "@/types/Gym";
import { useTranslations } from "next-intl";

export const CATALOG_STATUS_STYLE: Record<CatalogStatus, string> = {
  PUBLISHED: "bg-success-muted text-success",
  HIDDEN: "bg-muted text-muted-foreground",
  PAUSED: "bg-warning-muted text-warning",
  ARCHIVED: "bg-destructive/10 text-destructive",
};

/** Các chuyển trạng thái hợp lệ (ARCHIVED là trạng thái cuối — khớp BE). */
const NEXT_STATUSES: Record<CatalogStatus, CatalogStatus[]> = {
  PUBLISHED: ["HIDDEN", "PAUSED", "ARCHIVED"],
  HIDDEN: ["PUBLISHED", "PAUSED", "ARCHIVED"],
  PAUSED: ["PUBLISHED", "HIDDEN", "ARCHIVED"],
  ARCHIVED: [],
};

export function CatalogStatusBadge({ status }: { status?: CatalogStatus }) {
  const t = useTranslations();
  const s = status ?? "HIDDEN";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${CATALOG_STATUS_STYLE[s]}`}>
      {t(`gym.catalogStatus.${s}`)}
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
  const t = useTranslations();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const options = NEXT_STATUSES[status ?? "HIDDEN"];
  if (!options.length) return null;

  return (
    <>
      {/* Đây là menu thao tác (không phải field chọn giá trị) nên dùng
          DropdownMenu thay vì <select value=""> giả lập trước đây. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="h-7 cursor-pointer gap-1 px-2 text-[11px] font-semibold text-muted-foreground"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            {t("gym.catalog.changeStatus")}
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => (s === "ARCHIVED" ? setConfirmArchive(true) : onChange(s))}
              className={cn(
                "cursor-pointer text-xs font-semibold",
                s === "ARCHIVED" && "text-destructive focus:text-destructive",
              )}
            >
              {t(`gym.catalogStatus.${s}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmArchive} title={t("gym.catalog.archiveConfirmTitle")} onClose={() => setConfirmArchive(false)}>
        <p className="text-sm text-muted-foreground">
          {t("gym.catalog.archiveConfirmBody")}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmArchive(false)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
          <Button
            onClick={() => { setConfirmArchive(false); onChange("ARCHIVED"); }}
            className="bg-destructive hover:bg-destructive text-destructive-foreground"
          >
            {t("gym.catalog.archivePermanently")}
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
  const t = useTranslations();
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
      toast({ type: "success", title: t("gym.catalog.rulesSaved") });
      onClose();
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const depositInvalid = deposit !== "" && (Number(deposit) < 0 || Number(deposit) > 100);

  return (
    <Dialog open title={title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t("gym.catalog.depositLabel")}</label>
          <Input type="number" min={0} max={100} value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Vd: 30" />
          {depositInvalid && <p className="mt-1 text-xs text-destructive">{t("common.validation.percentRange")}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t("gym.catalog.freeCancelLabel")}</label>
          <Input type="number" min={0} value={freeCancel} onChange={(e) => setFreeCancel(e.target.value)} placeholder={t("gym.catalog.freeCancelPlaceholder")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t("gym.catalog.minLeadLabel")}</label>
          <Input type="number" min={0} value={minNotice} onChange={(e) => setMinNotice(e.target.value)} placeholder="Vd: 2" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={depositInvalid || mutation.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.catalog.saveRules")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
