"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, Plus, Pencil, Ban, GitBranch, MapPin, Phone, Loader2 } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { gymService } from "@/services/gym.service";
import type { BranchInput, BranchResponse } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";

export default function GymBranchesPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const displayName = user?.fullName ?? user?.username ?? "Gym";
  const initial = displayName[0]?.toUpperCase() ?? "G";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchResponse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["gym-branches"],
    queryFn: gymService.listOwnBranches,
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
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => gymService.deactivateBranch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-branches"] });
      setConfirmId(null);
      toast({ type: "success", title: "Đã vô hiệu hoá chi nhánh" });
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) }),
  });

  function openCreate() {
    setEditing(null); setName(""); setAddress(""); setCity(""); setPhone(""); setFormOpen(true);
  }
  function openEdit(b: BranchResponse) {
    setEditing(b); setName(b.name ?? ""); setAddress(b.address ?? ""); setCity(b.city ?? ""); setPhone(b.phone ?? ""); setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }
  function save() {
    if (!name.trim()) { toast({ type: "warning", title: "Vui lòng nhập tên chi nhánh" }); return; }
    saveMut.mutate({
      name: name.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none w-56 placeholder:text-gray-400" placeholder="Tìm kiếm chi nhánh..." />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <Bell className="size-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="flex items-center gap-2.5 pl-1">
            <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">{initial}</div>
            <span className="text-sm font-semibold text-gray-700">{displayName}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Quản lý chi nhánh</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý mạng lưới và vận hành các cơ sở phòng tập của bạn.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
            <Plus className="size-4" /> Thêm chi nhánh
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">Danh sách hệ thống</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <GitBranch className="size-10 mb-3" />
              <p className="text-sm">Chưa có chi nhánh nào.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 text-left">Tên chi nhánh</th>
                  <th className="pb-3 text-left">Địa chỉ</th>
                  <th className="pb-3 text-left">Liên hệ</th>
                  <th className="pb-3 text-left">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <MapPin className="size-4 text-blue-600" />
                        </div>
                        <span className="text-[13px] font-semibold text-[#0f172a]">{b.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-600">
                      {[b.address, b.city].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-3 text-xs text-gray-600">
                      {b.phone ? <span className="inline-flex items-center gap-1"><Phone className="size-3 text-gray-400" /> {b.phone}</span> : "—"}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        b.active === false ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {b.active === false ? "Ngừng" : "Đang hoạt động"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(b)} className="flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline">
                          <Pencil className="size-3.5" /> Sửa
                        </button>
                        {b.active !== false && (
                          <button onClick={() => b.id != null && setConfirmId(b.id)} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500">
                            <Ban className="size-3.5" /> Ngừng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={formOpen} title={editing ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh"} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên chi nhánh <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: FitMatch Quận 1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Địa chỉ</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, tên đường..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thành phố</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="TP. Hồ Chí Minh" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeForm} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">Hủy</Button>
            <Button onClick={save} disabled={saveMut.isPending} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
              {saveMut.isPending && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={confirmId !== null} title="Ngừng hoạt động chi nhánh?" onClose={() => setConfirmId(null)}>
        <p className="text-sm text-gray-600">Chi nhánh sẽ ngừng nhận đặt lịch. Bạn có chắc chắn?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setConfirmId(null)} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">Hủy</Button>
          <Button onClick={() => confirmId != null && deactivateMut.mutate(confirmId)} disabled={deactivateMut.isPending} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            {deactivateMut.isPending && <Loader2 className="size-4 animate-spin" />} Xác nhận
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
