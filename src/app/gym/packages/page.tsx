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
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";
import {
  BookingRulesDialog,
  CatalogStatusBadge,
  CatalogStatusMenu,
} from "@/modules/gym/components/catalog-controls";

// F-28: dùng formatter chung.
const vnd = (n?: number) => (typeof n === "number" ? formatCurrency(n) : "—");

export default function GymPackagesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingPackageResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
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
      toast({ type: "success", title: editing ? "Đã cập nhật gói tập" : "Đã tạo gói tập" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CatalogStatus }) =>
      gymService.updatePackageCatalogStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-packages"] });
      toast({ type: "success", title: "Đã đổi trạng thái gói" });
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) }),
  });

  function openCreate() {
    setEditing(null); setName(""); setDescription(""); setPrice(""); setSessionCount("");
    setValidityDays(""); setUsageConditions(""); setGymServiceId(""); setFormOpen(true);
  }
  function openEdit(p: TrainingPackageResponse) {
    setEditing(p); setName(p.name ?? ""); setDescription(p.description ?? "");
    setPrice(p.price != null ? String(p.price) : "");
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
    if (!name.trim()) { toast({ type: "warning", title: "Vui lòng nhập tên gói" }); return; }
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      toast({ type: "warning", title: "Vui lòng nhập giá hợp lệ" }); return;
    }
    if (!sessionCount.trim() || Number(sessionCount) <= 0) {
      toast({ type: "warning", title: "Số buổi phải là số nguyên dương" }); return;
    }
    saveMut.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      sessionCount: Number(sessionCount),
      validityDays: validityDays ? Number(validityDays) : undefined,
      usageConditions: usageConditions.trim() || undefined,
      gymServiceId: gymServiceId ? Number(gymServiceId) : undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gói tập</h1>
            <p className="text-sm text-muted-foreground mt-1">Gói nhiều buổi với hạn dùng — khách mua 1 lần, đặt lịch tiêu dần từng buổi.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="size-4" /> Tạo gói tập
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-card rounded-2xl border border-border">
            <p className="text-sm">{toErrorMessage(error)}</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
            <Package className="size-10 mb-3" />
            <p className="text-sm">Chưa có gói tập nào. Bấm &quot;Tạo gói tập&quot; để bắt đầu.</p>
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
                  <p className="text-[11px] font-semibold text-primary mt-0.5">Dịch vụ: {p.gymServiceName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{p.description || "Không có mô tả."}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.sessionCount} buổi{p.validityDays != null ? ` · hạn ${p.validityDays} ngày` : " · không giới hạn thời gian"}
                </div>
                {p.usageConditions && (
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">Điều kiện: {p.usageConditions}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-base font-extrabold text-primary">{vnd(p.price)}</span>
                  {p.sessionCount ? (
                    <span className="text-xs text-muted-foreground">≈ {vnd(Math.round((p.price ?? 0) / p.sessionCount))}/buổi</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <Pencil className="size-3.5" /> Sửa
                  </button>
                  <button onClick={() => setRulesTarget(p)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <SlidersHorizontal className="size-3.5" /> Quy tắc
                  </button>
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

      <Dialog open={formOpen} title={editing ? "Chỉnh sửa gói tập" : "Tạo gói tập"} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên gói <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Gói PT 10 buổi" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả gói tập..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Giá (₫) <span className="text-red-500">*</span></label>
              <Input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="4500000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Số buổi <span className="text-red-500">*</span></label>
              <Input value={sessionCount} onChange={e => setSessionCount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="10" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hạn dùng (ngày)</label>
              <Input value={validityDays} onChange={e => setValidityDays(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="90" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gắn với dịch vụ (buổi trong gói dùng thời lượng/PT của dịch vụ này)</label>
            <select
              value={gymServiceId}
              onChange={(e) => setGymServiceId(e.target.value)}
              className="w-full h-10 text-sm border border-border rounded-lg px-2.5 bg-card text-foreground"
            >
              <option value="">— Không gắn dịch vụ —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Điều kiện sử dụng</label>
            <Textarea value={usageConditions} onChange={e => setUsageConditions(e.target.value)} rows={2} placeholder="Vd: Không hoàn tiền buổi đã tiêu, đặt lịch trước 24h..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </div>
        </div>
      </Dialog>

      {rulesTarget && (
        <BookingRulesDialog
          title={`Quy tắc đặt lịch — ${rulesTarget.name}`}
          initial={rulesTarget.bookingRules}
          onSave={(rules) => gymService.updatePackageBookingRules(rulesTarget.id!, rules)}
          onClose={() => setRulesTarget(null)}
        />
      )}
    </main>
  );
}
