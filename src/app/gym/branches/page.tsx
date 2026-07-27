"use client";

// Gói 2.C (audit 2026-07-17):
// - B-13/B-14 (DATA LOSS): form thêm amenities + capacity — BE update set vô điều kiện
//   2 field này, payload thiếu chúng là xóa trắng dữ liệu đã có mỗi lần bấm Sửa.
// - B-11 (UC-017): dialog Giờ mở cửa per-branch (BE có sẵn, trước đây không UI nào gọi).

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Ban, GitBranch, MapPin, Phone, Loader2, Clock } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { BranchInput, BranchResponse, OperatingHour } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { TimePicker } from "@/shared/components/ui/time-picker";
import { useTranslations } from "next-intl";
import { weekdayKey } from "@/shared/utils/enum-label.util";
import { DataTable } from "@/shared/components/common/data-table";


/** UC-017: editor giờ mở cửa 7 ngày (dayOfWeek 1-7 khớp BE). */
function OperatingHoursDialog({ branch, onClose }: { branch: BranchResponse; onClose: () => void }) {
  const t = useTranslations();
  const { toast } = useToast();
  const [rows, setRows] = useState<OperatingHour[]>(
    Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, closed: true })),
  );

  const query = useQuery({
    queryKey: ["gym-branches", branch.id, "hours"],
    queryFn: () => gymService.getOperatingHours(branch.id!),
    enabled: branch.id != null,
  });

  useEffect(() => {
    if (!query.data) return;
    setRows(
      Array.from({ length: 7 }, (_, i) => {
        const day = i + 1;
        const existing = query.data.find((h) => h.dayOfWeek === day);
        return existing
          ? { dayOfWeek: day, openTime: existing.openTime?.slice(0, 5), closeTime: existing.closeTime?.slice(0, 5), closed: existing.closed ?? false }
          : { dayOfWeek: day, closed: true };
      }),
    );
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      gymService.updateOperatingHours(
        branch.id!,
        rows.map((r) =>
          r.closed
            ? { dayOfWeek: r.dayOfWeek, closed: true }
            : { dayOfWeek: r.dayOfWeek, openTime: r.openTime, closeTime: r.closeTime, closed: false },
        ),
      ),
    onSuccess: () => {
      toast({ type: "success", title: t("gym.branches.hoursSaved") });
      onClose();
    },
    // BE chặn thu hẹp lịch đè booking tương lai (409) — hiện nguyên văn lý do.
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const invalid = rows.some((r) => !r.closed && (!r.openTime || !r.closeTime || r.openTime >= r.closeTime));

  function patchRow(day: number, patch: Partial<OperatingHour>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  }

  return (
    <Dialog open title={t("gym.branches.hoursDialogTitle", { name: branch.name ?? "" })} onClose={onClose}>
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.dayOfWeek} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-semibold text-foreground">{t(weekdayKey(r.dayOfWeek))}</span>
              <CheckboxField
                checked={!r.closed}
                onCheckedChange={(open) => patchRow(r.dayOfWeek, { closed: !open })}
                label={t("gym.branches.open")}
                labelClassName="text-xs font-medium text-muted-foreground"
              />
              {!r.closed && (
                <>
                  <TimePicker value={r.openTime ?? ""} className="h-8 w-28 text-xs"
                    onChange={(v) => patchRow(r.dayOfWeek, { openTime: v ?? "" })} />
                  <span className="text-xs text-muted-foreground">→</span>
                  <TimePicker value={r.closeTime ?? ""} className="h-8 w-28 text-xs"
                    onChange={(v) => patchRow(r.dayOfWeek, { closeTime: v ?? "" })} />
                </>
              )}
            </div>
          ))}
          {invalid && <p className="text-xs text-destructive">{t("gym.branches.hoursInvalid")}</p>}
          <div className="flex justify-end gap-2 pt-3">
            <Button onClick={onClose} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={() => save.mutate()} disabled={invalid || save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.branches.saveHours")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default function GymBranchesPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchResponse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [amenities, setAmenities] = useState("");
  const [capacity, setCapacity] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [hoursBranch, setHoursBranch] = useState<BranchResponse | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["gym-branches"],
    queryFn: gymService.listOwnBranches
  });

  const saveMut = useMutation({
    mutationFn: (payload: BranchInput) =>
      editing?.id != null
        ? gymService.editBranch(editing.id, payload)
        : gymService.addBranch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-branches"] });
      closeForm();
      toast({ type: "success", title: editing ? t("gym.branches.updated") : t("gym.branches.added") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => gymService.deactivateBranch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-branches"] });
      setConfirmId(null);
      toast({ type: "success", title: t("gym.branches.disabled") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null); setName(""); setAddress(""); setCity(""); setPhone("");
    setAmenities(""); setCapacity(""); setFormOpen(true);
  }
  function openEdit(b: BranchResponse) {
    setEditing(b); setName(b.name ?? ""); setAddress(b.address ?? ""); setCity(b.city ?? ""); setPhone(b.phone ?? "");
    // B-13: pre-fill amenities/capacity — thiếu chúng trong payload update là mất dữ liệu.
    setAmenities(b.amenities ?? ""); setCapacity(b.capacity != null ? String(b.capacity) : "");
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }
  function save() {
    if (!name.trim()) { toast({ type: "warning", title: t("gym.branches.nameRequired") }); return; }
    if (capacity && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) {
      toast({ type: "warning", title: t("gym.branches.capacityInvalid") }); return;
    }
    saveMut.mutate({
      name: name.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      amenities: amenities.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("gym.branches.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("gym.branches.subtitle")}</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" /> {t("gym.branches.add")}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">{t("gym.branches.listTitle")}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GitBranch className="size-10 mb-3" />
              <p className="text-sm">{t("gym.branches.empty")}</p>
            </div>
          ) : (
            <DataTable
              minWidth="35rem"
              rows={branches}
              rowKey={(b) => String(b.id)}
              emptyTitle={t("gym.branches.empty")}
              columns={[
                {
                  key: "name",
                  header: t("gym.branches.nameCol"),
                  cell: (b) => (
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="size-4 text-primary" />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground">{b.name}</span>
                    </div>
                  ),
                },
                {
                  key: "address",
                  header: t("common.table.address"),
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (b) => (
                    <>
                      <p>{[b.address, b.city].filter(Boolean).join(", ") || "—"}</p>
                      {b.amenities && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {t("gym.branches.amenitiesLabel")} {b.amenities}
                        </p>
                      )}
                      {b.capacity != null && (
                        <p className="text-[11px] text-muted-foreground/80">
                          {t("gym.branches.capacityLabel")} {b.capacity} {t("gym.branches.capacityUnit")}
                        </p>
                      )}
                    </>
                  ),
                },
                {
                  key: "contact",
                  header: t("gym.branches.contact"),
                  hideBelow: "sm",
                  cellClassName: "text-xs text-muted-foreground",
                  cell: (b) =>
                    b.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground" /> {b.phone}
                      </span>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "status",
                  header: t("common.table.status"),
                  cell: (b) => (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        b.active === false
                          ? "bg-muted text-muted-foreground"
                          : "bg-success-muted text-success"
                      }`}
                    >
                      {b.active === false ? t("common.states.stopped") : t("common.states.active")}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: t("common.table.actions"),
                  align: "right",
                  cell: (b) => (
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="link" size="inline"
 onClick={() => setHoursBranch(b)}
 className="flex gap-1 text-primary"
>
                        <Clock className="size-3.5" /> {t("gym.branches.hoursTitle")}
                      </Button>
                      <Button variant="link" size="inline"
 onClick={() => openEdit(b)}
 className="flex gap-1 text-primary"
>
                        <Pencil className="size-3.5" />
                        {t("common.actions.edit")}
                      </Button>
                      {b.active !== false && (
                        <button
                          onClick={() => b.id != null && setConfirmId(b.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
                        >
                          <Ban className="size-3.5" /> {t("common.states.stopped")}
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      <Dialog open={formOpen} title={editing ? t("gym.branches.editTitle") : t("gym.branches.add")} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.branches.nameCol")} <span className="text-destructive">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("gym.branches.namePlaceholder")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.address")}</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder={t("gym.branches.addressPlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.city")}</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder={t("gym.branches.cityPlaceholder")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.phone")}</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.branches.amenitiesInput")}</label>
            <Input value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="Vd: Parking,Sauna,Pool" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.branches.capacityInput")}</label>
            <Input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} placeholder={t("gym.branches.capacityPlaceholder")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </Dialog>

      {hoursBranch && <OperatingHoursDialog branch={hoursBranch} onClose={() => setHoursBranch(null)} />}

      <Dialog open={confirmId !== null} title={t("gym.branches.disableConfirmTitle")} onClose={() => setConfirmId(null)}>
        <p className="text-sm text-muted-foreground">{t("gym.branches.disableConfirmBody")}</p>
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
