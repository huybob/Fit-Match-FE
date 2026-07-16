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

export default function GymFacilitiesPage() {
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
      toast({ type: "success", title: editing ? "Đã cập nhật tiện ích" : "Đã thêm tiện ích" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) })
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => gymService.deactivateFacility(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-facilities"] });
      setConfirmId(null);
      toast({ type: "success", title: "Đã vô hiệu hoá tiện ích" });
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) })
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
    if (!name.trim()) { toast({ type: "warning", title: "Vui lòng nhập tên tiện ích" }); return; }
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
            <h1 className="text-2xl font-bold text-foreground">Tiện ích & Cơ sở vật chất</h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý và cập nhật trang thiết bị, không gian luyện tập.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="size-4" /> Thêm tiện ích mới
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : facilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
            <Dumbbell className="size-10 mb-3" />
            <p className="text-sm">Chưa có tiện ích nào. Bấm &quot;Thêm tiện ích mới&quot; để bắt đầu.</p>
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
                    f.active === false ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {f.active === false ? "Ngừng" : <><CheckCircle2 className="size-3" /> Đang hoạt động</>}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-foreground">{f.name}</h3>
                {f.branchName && (
                  <p className="text-[11px] font-semibold text-primary mt-0.5">Chi nhánh: {f.branchName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-3">{f.description || "Không có mô tả."}</p>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <button onClick={() => openEdit(f)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <Pencil className="size-3.5" /> Sửa
                  </button>
                  {f.active !== false && (
                    <button onClick={() => f.id != null && setConfirmId(f.id)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500 ml-auto">
                      <Ban className="size-3.5" /> Vô hiệu hoá
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} title={editing ? "Chỉnh sửa tiện ích" : "Thêm tiện ích mới"} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên tiện ích <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Phòng Gym chuyên sâu" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả chi tiết</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Mô tả không gian, thiết bị, đặc điểm nổi bật..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chi nhánh</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full h-10 text-sm border border-border rounded-lg px-2.5 bg-card text-foreground"
            >
              <option value="">— Chưa gắn chi nhánh —</option>
              {branches.filter((b) => b.active !== false).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={confirmId !== null} title="Vô hiệu hoá tiện ích?" onClose={() => setConfirmId(null)}>
        <p className="text-sm text-muted-foreground">Tiện ích sẽ không còn hiển thị cho khách hàng. Bạn có chắc chắn?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setConfirmId(null)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
          <Button onClick={() => confirmId != null && deactivateMut.mutate(confirmId)} disabled={deactivateMut.isPending} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            {deactivateMut.isPending && <Loader2 className="size-4 animate-spin" />} Xác nhận
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
