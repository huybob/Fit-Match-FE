"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Ban, Dumbbell, Loader2, CheckCircle2 } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { FacilityInput, FacilityResponse } from "@/types/Gym";
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
import { useTranslations } from "next-intl";

export default function GymFacilitiesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FacilityResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // B-14 (audit 2026-07-17): gắn tiện ích vào chi nhánh — BE hỗ trợ sẵn, FE thiếu field.
  const [branchId, setBranchId] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ["gym-facilities"],
    queryFn: gymService.listOwnFacilities
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["gym-branches"],
    queryFn: gymService.listOwnBranches,
  });

  const saveMut = useMutation({
    mutationFn: (payload: FacilityInput) =>
      editing?.id != null
        ? gymService.editFacility(editing.id, payload)
        : gymService.addFacility(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-facilities"] });
      closeForm();
      toast({ type: "success", title: editing ? t("gym.facilities.updated") : t("gym.facilities.added") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => gymService.deactivateFacility(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-facilities"] });
      setConfirmId(null);
      toast({ type: "success", title: t("gym.facilities.disabled") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null); setName(""); setDescription(""); setBranchId(""); setFormOpen(true);
  }
  function openEdit(f: FacilityResponse) {
    setEditing(f); setName(f.name ?? ""); setDescription(f.description ?? "");
    setBranchId(f.branchId != null ? String(f.branchId) : "");
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null); setName(""); setDescription(""); setBranchId("");
  }
  function save() {
    if (!name.trim()) { toast({ type: "warning", title: t("gym.facilities.nameRequired") }); return; }
    saveMut.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      branchId: branchId ? Number(branchId) : undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.facilities.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.facilities.subtitle")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" /> {t("gym.facilities.addNew")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : facilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
            <Dumbbell className="size-10 mb-3" />
            <p className="text-sm">Chưa có tiện ích nào. Bấm &quot;{t("gym.facilities.addNew")}&quot; để bắt đầu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((f) => (
              <div key={f.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="size-5 text-primary" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    f.active === false ? "bg-muted text-muted-foreground" : "bg-success-muted text-success"
                  }`}>
                    {f.active === false ? t("common.states.stopped") : <><CheckCircle2 className="size-3" /> Đang hoạt động</>}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-foreground">{f.name}</h3>
                {f.branchName && (
                  <p className="text-[11px] font-semibold text-primary mt-0.5">{t("gym.facilities.branchLabel")} {f.branchName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-3">{f.description || t("gym.facilities.noDescription")}</p>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <Button variant="link" size="inline" onClick={() => openEdit(f)} className="flex gap-1.5 text-primary">
                    <Pencil className="size-3.5" />{t("common.actions.edit")}</Button>
                  {f.active !== false && (
                    <button onClick={() => f.id != null && setConfirmId(f.id)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive ml-auto">
                      <Ban className="size-3.5" /> {t("gym.facilities.disable")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} title={editing ? t("gym.facilities.editTitle") : t("gym.facilities.addNew")} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.facilities.nameLabel")} <span className="text-destructive">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("gym.facilities.namePlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.facilities.descLabel")}</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={t("gym.facilities.descPlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.nav.branches")}</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder={t("gym.facilities.noBranch")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("gym.facilities.noBranch")}</SelectItem>
                {branches.filter((b) => b.active !== false).map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={confirmId !== null} title={t("gym.facilities.disableConfirmTitle")} onClose={() => setConfirmId(null)}>
        <p className="text-sm text-muted-foreground">{t("gym.facilities.disableConfirmBody")}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setConfirmId(null)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
          <Button onClick={() => confirmId != null && deactivateMut.mutate(confirmId)} disabled={deactivateMut.isPending} className="gap-2 bg-destructive hover:bg-destructive text-destructive-foreground">
            {deactivateMut.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.confirm")}
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
