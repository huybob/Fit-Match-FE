"use client";

import { formatCurrency } from "@/utils/format.util";
// B-15 (audit 2026-07-17, UC-025): trước đây TrainingPackageController (7 endpoint BE)
// có 0 caller FE — gym không thể tạo gói tập; marketplace chỉ có mock. Trang này là
// CRUD thật + quy tắc đặt lịch (UC-026) + trạng thái catalog (UC-027).

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Package, Loader2, SlidersHorizontal } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { CatalogStatus, TrainingPackageInput, TrainingPackageResponse } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";
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

export default function GymPackagesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingPackageResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  // Bug S2-05: giá niêm yết là giá TỰ TẬP; đây là phần cộng thêm khi khách chọn PT.
  const [ptSurcharge, setPtSurcharge] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [validityDays, setValidityDays] = useState("");
  const [usageConditions, setUsageConditions] = useState("");
  const [gymServiceId, setGymServiceId] = useState("");
  const [rulesTarget, setRulesTarget] = useState<TrainingPackageResponse | null>(null);

  const { data: packages = [], isLoading, isError, error } = useQuery({
    queryKey: ["gym-packages"],
    queryFn: gymService.listOwnPackages,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["gym-services"],
    queryFn: gymService.listOwnServices,
  });

  const saveMut = useMutation({
    mutationFn: (payload: TrainingPackageInput) =>
      editing?.id != null
        ? gymService.editPackage(editing.id, payload)
        : gymService.addPackage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-packages"] });
      closeForm();
      toast({ type: "success", title: editing ? t("gym.packages.updated") : t("gym.packages.created") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CatalogStatus }) =>
      gymService.updatePackageCatalogStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-packages"] });
      toast({ type: "success", title: t("gym.packages.statusChanged") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  function openCreate() {
    setEditing(null); setName(""); setDescription(""); setPrice(""); setPtSurcharge(""); setSessionCount("");
    setValidityDays(""); setUsageConditions(""); setGymServiceId(""); setFormOpen(true);
  }
  function openEdit(p: TrainingPackageResponse) {
    setEditing(p); setName(p.name ?? ""); setDescription(p.description ?? "");
    setPrice(p.price != null ? String(p.price) : "");
    setPtSurcharge(p.ptSurcharge != null ? String(p.ptSurcharge) : "");
    setSessionCount(p.sessionCount != null ? String(p.sessionCount) : "");
    setValidityDays(p.validityDays != null ? String(p.validityDays) : "");
    setUsageConditions(p.usageConditions ?? "");
    setGymServiceId(p.gymServiceId != null ? String(p.gymServiceId) : "");
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }
  function save() {
    if (!name.trim()) { toast({ type: "warning", title: t("gym.packages.nameRequired") }); return; }
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      toast({ type: "warning", title: t("common.validation.priceInvalid") }); return;
    }
    if (!sessionCount.trim() || Number(sessionCount) <= 0) {
      toast({ type: "warning", title: t("gym.packages.sessionsInvalid") }); return;
    }
    saveMut.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      // Bỏ trống = không tính thêm; gửi undefined để BE giữ NULL thay vì 0.
      ptSurcharge: ptSurcharge.trim() ? Number(ptSurcharge) : undefined,
      sessionCount: Number(sessionCount),
      validityDays: validityDays ? Number(validityDays) : undefined,
      usageConditions: usageConditions.trim() || undefined,
      gymServiceId: gymServiceId ? Number(gymServiceId) : undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.packages.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.packages.subtitle")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" /> {t("gym.packages.create")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-destructive bg-card rounded-2xl border border-border">
            <p className="text-sm">{toErrorMessage(error)}</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
            <Package className="size-10 mb-3" />
            <p className="text-sm">{t("gym.packages.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="size-5 text-primary" />
                  </div>
                  <CatalogStatusBadge status={p.status} />
                </div>
                <h3 className="text-[15px] font-bold text-foreground">{p.name}</h3>
                {p.gymServiceName && (
                  <p className="text-[11px] font-semibold text-primary mt-0.5">{t("gym.packages.serviceLabel")} {p.gymServiceName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{p.description || t("gym.catalog.noDescription")}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.validityDays != null
                    ? t("gym.packages.sessionsSummary", { count: p.sessionCount ?? 0, days: p.validityDays })
                    : t("gym.packages.sessionsSummaryNoExpiry", { count: p.sessionCount ?? 0 })}
                </div>
                {p.usageConditions && (
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{t("gym.packages.conditionsLabel")} {p.usageConditions}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-base font-extrabold text-primary">{vnd(p.price)}</span>
                  {p.sessionCount ? (
                    <span className="text-xs text-muted-foreground">≈ {vnd(Math.round((p.price ?? 0) / p.sessionCount))}{t("gym.packages.perSession")}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Button variant="link" size="inline" onClick={() => openEdit(p)} className="flex gap-1.5 text-primary">
                    <Pencil className="size-3.5" />{t("common.actions.edit")}</Button>
                  <Button variant="link" size="inline" onClick={() => setRulesTarget(p)} className="flex gap-1.5 text-primary">
                    <SlidersHorizontal className="size-3.5" /> {t("gym.catalog.rulesShort")}
                  </Button>
                  <div className="ml-auto">
                    <CatalogStatusMenu
                      status={p.status}
                      pending={statusMut.isPending}
                      onChange={(next) => p.id != null && statusMut.mutate({ id: p.id, status: next })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} title={editing ? t("gym.packages.editTitle") : t("gym.packages.create")} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.packages.nameLabel")} <span className="text-destructive">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("gym.packages.namePlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.description")}</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t("gym.packages.descPlaceholder")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.packages.priceLabel")} <span className="text-destructive">*</span></label>
              <Input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="4500000" />
              <p className="mt-1 text-[11px] text-muted-foreground">{t("gym.services.priceHint")}</p>
            </div>
            <div>
              {/* Bug S2-05: khách bỏ trống PT để tiết kiệm — mức chênh do gym tự đặt. */}
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.services.ptSurchargeLabel")}</label>
              <Input value={ptSurcharge} onChange={e => setPtSurcharge(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" />
              <p className="mt-1 text-[11px] text-muted-foreground">{t("gym.services.ptSurchargeHint")}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.packages.sessionsLabel")} <span className="text-destructive">*</span></label>
              <Input value={sessionCount} onChange={e => setSessionCount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="10" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.packages.validityLabel")}</label>
              <Input value={validityDays} onChange={e => setValidityDays(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="90" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.packages.linkServiceLabel")}</label>
            <Select value={gymServiceId} onValueChange={setGymServiceId}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder={t("gym.packages.noService")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("gym.packages.noService")}</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.packages.termsLabel")}</label>
            <Textarea value={usageConditions} onChange={e => setUsageConditions(e.target.value)} rows={2} placeholder={t("gym.packages.termsPlaceholder")} />
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
          onSave={(rules) => gymService.updatePackageBookingRules(rulesTarget.id!, rules)}
          onClose={() => setRulesTarget(null)}
        />
      )}
    </main>
  );
}
