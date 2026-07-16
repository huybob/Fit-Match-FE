"use client";

// Gói 2.C (audit 2026-07-17):
// - B-13/B-14 (DATA LOSS): form thêm amenities + capacity — BE update set vô điều kiện
//   2 field này, payload thiếu chúng là xóa trắng dữ liệu đã có mỗi lần bấm "Sửa".
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

const DAY_LABELS: Record<number, string> = {
  1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật",
};

/** UC-017: editor giờ mở cửa 7 ngày (dayOfWeek 1-7 khớp BE). */
function OperatingHoursDialog({ branch, onClose }: { branch: BranchResponse; onClose: () => void }) {
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
      toast({ type: "success", title: "Đã lưu giờ mở cửa" });
      onClose();
    },
    // BE chặn thu hẹp lịch đè booking tương lai (409) — hiện nguyên văn lý do.
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  const invalid = rows.some((r) => !r.closed && (!r.openTime || !r.closeTime || r.openTime >= r.closeTime));

  function patchRow(day: number, patch: Partial<OperatingHour>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  }

  return (
    <Dialog open title={`Giờ mở cửa — ${branch.name}`} onClose={onClose}>
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.dayOfWeek} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-semibold text-foreground">{DAY_LABELS[r.dayOfWeek]}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!r.closed}
                  onChange={(e) => patchRow(r.dayOfWeek, { closed: !e.target.checked })}
                  className="size-3.5 accent-primary"
                />
                Mở
              </label>
              {!r.closed && (
                <>
                  <Input type="time" value={r.openTime ?? ""} className="h-8 w-28 text-xs"
                    onChange={(e) => patchRow(r.dayOfWeek, { openTime: e.target.value })} />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input type="time" value={r.closeTime ?? ""} className="h-8 w-28 text-xs"
                    onChange={(e) => patchRow(r.dayOfWeek, { closeTime: e.target.value })} />
                </>
              )}
            </div>
          ))}
          {invalid && <p className="text-xs text-red-500">Mỗi ngày mở cần giờ mở &lt; giờ đóng.</p>}
          <div className="flex justify-end gap-2 pt-3">
            <Button onClick={onClose} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
            <Button onClick={() => save.mutate()} disabled={invalid || save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu giờ mở cửa
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default function GymBranchesPage() {
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
      toast({ type: "success", title: editing ? "Đã cập nhật chi nhánh" : "Đã thêm chi nhánh" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) })
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => gymService.deactivateBranch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-branches"] });
      setConfirmId(null);
      toast({ type: "success", title: "Đã vô hiệu hoá chi nhánh" });
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) })
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
    if (!name.trim()) { toast({ type: "warning", title: "Vui lòng nhập tên chi nhánh" }); return; }
    if (capacity && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) {
      toast({ type: "warning", title: "Sức chứa phải là số nguyên dương" }); return;
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
            <h1 className="text-2xl font-bold text-foreground">Quản lý chi nhánh</h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý mạng lưới và vận hành các cơ sở phòng tập của bạn.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="size-4" /> Thêm chi nhánh
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Danh sách hệ thống</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GitBranch className="size-10 mb-3" />
              <p className="text-sm">Chưa có chi nhánh nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="pb-3 text-left">Tên chi nhánh</th>
                  <th className="pb-3 text-left">Địa chỉ</th>
                  <th className="pb-3 text-left">Liên hệ</th>
                  <th className="pb-3 text-left">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="size-4 text-primary" />
                        </div>
                        <span className="text-[13px] font-semibold text-foreground">{b.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      <p>{[b.address, b.city].filter(Boolean).join(", ") || "—"}</p>
                      {b.amenities && <p className="mt-0.5 text-[11px] text-muted-foreground/80">Tiện ích: {b.amenities}</p>}
                      {b.capacity != null && <p className="text-[11px] text-muted-foreground/80">Sức chứa: {b.capacity} khách/khung giờ</p>}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {b.phone ? <span className="inline-flex items-center gap-1"><Phone className="size-3 text-muted-foreground" /> {b.phone}</span> : "—"}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        b.active === false ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {b.active === false ? "Ngừng" : "Đang hoạt động"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setHoursBranch(b)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          <Clock className="size-3.5" /> Giờ mở cửa
                        </button>
                        <button onClick={() => openEdit(b)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          <Pencil className="size-3.5" /> Sửa
                        </button>
                        {b.active !== false && (
                          <button onClick={() => b.id != null && setConfirmId(b.id)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-red-500">
                            <Ban className="size-3.5" /> Ngừng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>

      <Dialog open={formOpen} title={editing ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh"} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên chi nhánh <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: FitMatch Quận 1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Địa chỉ</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, tên đường..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Thành phố</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="TP. Hồ Chí Minh" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Số điện thoại</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tiện ích (phân tách bằng dấu phẩy)</label>
            <Input value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="Vd: Parking,Sauna,Pool" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sức chứa tối đa mỗi khung giờ</label>
            <Input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Để trống = không giới hạn" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </div>
        </div>
      </Dialog>

      {hoursBranch && <OperatingHoursDialog branch={hoursBranch} onClose={() => setHoursBranch(null)} />}

      <Dialog open={confirmId !== null} title="Ngừng hoạt động chi nhánh?" onClose={() => setConfirmId(null)}>
        <p className="text-sm text-muted-foreground">Chi nhánh sẽ ngừng nhận đặt lịch. Bạn có chắc chắn?</p>
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
