"use client";

import { formatCurrency } from "@/utils/format.util";
// Gói 2.C (audit 2026-07-17):
// - B-21/BE-7: select danh mục từ /gym/service-categories (trước đây update luôn ghi category=null).
// - B-22: durationMinutes bắt buộc (BE @NotNull) — hết 400 khó hiểu.
// - B-23 (UC-026): dialog quy tắc đặt lịch (cọc/hủy/đặt trước).
// - B-24 (UC-027): trạng thái catalog PUBLISHED/HIDDEN/PAUSED/ARCHIVED thay nút "Vô hiệu hoá" một chiều.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Sparkles, Clock, Loader2, SlidersHorizontal } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { CatalogStatus, GymServiceInput, GymServiceResponse } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  BookingRulesDialog,
  CatalogStatusBadge,
  CatalogStatusMenu,
} from "@/modules/gym/components/catalog-controls";
import { useTranslations } from "next-intl";

// F-28: dùng formatter chung.
const vnd = (n?: number) => (typeof n === "number" ? formatCurrency(n) : "—");

export default function GymServicesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymServiceResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  // Bug S2-05: giá niêm yết là giá TỰ TẬP; đây là phần cộng thêm khi khách chọn PT.
  const [ptSurcharge, setPtSurcharge] = useState("");
  const [duration, setDuration] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [eligibilityNotes, setEligibilityNotes] = useState("");
  const [rulesTarget, setRulesTarget] = useState<GymServiceResponse | null>(null);

  const { data: services = [], isLoading, isError, error } = useQuery({
    queryKey: ["gym-services"],
    queryFn: gymService.listOwnServices
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["gym-service-categories"],
    queryFn: gymService.listServiceCategories,
  });

  const saveMut = useMutation({
    mutationFn: (payload: GymServiceInput) =>
      editing?.id != null
        ? gymService.editService(editing.id, payload)
        : gymService.addService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-services"] });
      closeForm();
      toast({ type: "success", title: editing ? t("gym.services.updated") : t("gym.services.added") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CatalogStatus }) =>
      gymService.updateServiceCatalogStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-services"] });
      toast({ type: "success", title: t("gym.services.statusChanged") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null); setName(""); setDescription(""); setPrice(""); setPtSurcharge(""); setDuration("");
    setCategoryId(""); setEligibilityNotes(""); setFormOpen(true);
  }
  function openEdit(s: GymServiceResponse) {
    setEditing(s); setName(s.name ?? ""); setDescription(s.description ?? "");
    setPrice(s.price != null ? String(s.price) : ""); setDuration(s.durationMinutes != null ? String(s.durationMinutes) : "");
    setPtSurcharge(s.ptSurcharge != null ? String(s.ptSurcharge) : "");
    setCategoryId(s.categoryId != null ? String(s.categoryId) : "");
    setEligibilityNotes(s.eligibilityNotes ?? "");
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }
  function save() {
    if (!name.trim()) { toast({ type: "warning", title: t("gym.services.nameRequired") }); return; }
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      toast({ type: "warning", title: t("common.validation.priceInvalid") }); return;
    }
    // B-22: BE @NotNull @Positive — validate ngay tại client.
    if (!duration.trim() || Number(duration) <= 0) {
      toast({ type: "warning", title: t("gym.services.durationRequired") }); return;
    }
    saveMut.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      // Bỏ trống = không tính thêm; gửi undefined để BE giữ NULL thay vì 0.
      ptSurcharge: ptSurcharge.trim() ? Number(ptSurcharge) : undefined,
      durationMinutes: Number(duration),
      categoryId: categoryId ? Number(categoryId) : undefined,
      eligibilityNotes: eligibilityNotes.trim() || undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.services.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.services.subtitle")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" /> {t("gym.services.add")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-destructive bg-card rounded-2xl border border-border">
            <p className="text-sm">{toErrorMessage(error)}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
            <Sparkles className="size-10 mb-3" />
            <p className="text-sm">{t("gym.services.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-5 text-primary" />
                  </div>
                  <CatalogStatusBadge status={s.status} />
                </div>
                <h3 className="text-[15px] font-bold text-foreground">{s.name}</h3>
                {s.categoryName && (
                  <p className="text-[11px] font-semibold text-primary mt-0.5">{s.categoryName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{s.description || t("gym.catalog.noDescription")}</p>
                {s.bookingRules && (s.bookingRules.depositPercent != null || s.bookingRules.freeCancellationHours != null || s.bookingRules.minNoticeHours != null) && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {[
                      s.bookingRules.depositPercent != null ? t("gym.catalog.depositBadge", { percent: s.bookingRules.depositPercent }) : null,
                      s.bookingRules.freeCancellationHours != null ? t("gym.catalog.freeCancelBadge", { hours: s.bookingRules.freeCancellationHours }) : null,
                      s.bookingRules.minNoticeHours != null ? t("gym.catalog.minNoticeBadge", { hours: s.bookingRules.minNoticeHours }) : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-base font-extrabold text-primary">{vnd(s.price)}</span>
                  {s.durationMinutes != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {s.durationMinutes} {t("gym.services.minutes")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Button variant="link" size="inline" onClick={() => openEdit(s)} className="flex gap-1.5 text-primary">
                    <Pencil className="size-3.5" />{t("common.actions.edit")}</Button>
                  <Button variant="link" size="inline" onClick={() => setRulesTarget(s)} className="flex gap-1.5 text-primary">
                    <SlidersHorizontal className="size-3.5" /> {t("gym.catalog.rulesShort")}
                  </Button>
                  <div className="ml-auto">
                    <CatalogStatusMenu
                      status={s.status}
                      pending={statusMut.isPending}
                      onChange={(next) => s.id != null && statusMut.mutate({ id: s.id, status: next })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} title={editing ? t("gym.services.editTitle") : t("gym.services.add")} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.nameLabel")} <span className="text-destructive">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("gym.services.namePlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.description")}</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t("gym.services.descPlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.priceLabel")} <span className="text-destructive">*</span></label>
              <Input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="500000" />
              <p className="mt-1 text-[11px] text-muted-foreground">{t("gym.services.priceHint")}</p>
            </div>
            <div>
              {/* Bug S2-05: khách bỏ trống PT để tiết kiệm — mức chênh do gym tự đặt. */}
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.ptSurchargeLabel")}</label>
              <Input value={ptSurcharge} onChange={e => setPtSurcharge(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" />
              <p className="mt-1 text-[11px] text-muted-foreground">{t("gym.services.ptSurchargeHint")}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.durationLabel")} <span className="text-destructive">*</span></label>
              <Input value={duration} onChange={e => setDuration(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="60" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.categoryLabel")}</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder={t("gym.services.noCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("gym.services.noCategory")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.eligibilityLabel")}</label>
            <Textarea value={eligibilityNotes} onChange={e => setEligibilityNotes(e.target.value)} rows={2} placeholder={t("gym.services.eligibilityPlaceholder")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>

      {rulesTarget && (
        <BookingRulesDialog
          title={t("gym.catalog.rulesDialogTitle", { name: rulesTarget.name ?? "" })}
          initial={rulesTarget.bookingRules}
          onSave={(rules) => gymService.updateServiceBookingRules(rulesTarget.id!, rules)}
          onClose={() => setRulesTarget(null)}
        />
      )}
    </main>
  );
}
