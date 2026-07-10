"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Search, Loader2, Building2, Eye } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { UpdateGymProfileInput } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { WorkspaceUserMenu } from "@/shared/components/common/workspace-user-menu";

export default function GymSettingsPage() {
  const { toast } = useToast();

  const [gymName, setGymName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [visible, setVisible] = useState(true);

  const { data: status, isLoading } = useQuery({
    queryKey: ["gym-verification-status"],
    queryFn: gymService.getVerificationStatus,
  });

  useEffect(() => {
    if (!status) return;
    setGymName(status.gymName ?? "");
    setDescription(status.description ?? "");
    setAddress(status.address ?? "");
    setCity(status.city ?? "");
    setPhone(status.phone ?? "");
  }, [status]);

  const saveProfile = useMutation({
    mutationFn: (payload: UpdateGymProfileInput) => gymService.updateProfile(payload),
    onSuccess: () => toast({ type: "success", title: "Đã cập nhật hồ sơ phòng gym" }),
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  const saveVisibility = useMutation({
    mutationFn: (v: boolean) => gymService.setVisibility(v),
    onSuccess: (_d, v) => toast({ type: "success", title: v ? "Đã hiển thị trên marketplace" : "Đã ẩn khỏi marketplace" }),
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  function submit() {
    if (!gymName.trim()) { toast({ type: "warning", title: "Nhập tên phòng gym" }); return; }
    saveProfile.mutate({
      gymName: gymName.trim(),
      description: description.trim() || undefined,
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
          <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none w-56 placeholder:text-gray-400" placeholder="Tìm kiếm..." />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><Bell className="size-4" /></button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <WorkspaceUserMenu />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">Cài đặt</h1>
          <p className="text-sm text-gray-500 mt-1">Cập nhật hồ sơ công khai và trạng thái hiển thị của phòng gym.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#0f172a] mb-4"><Building2 className="size-4 text-blue-600" /> Hồ sơ phòng gym</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên phòng gym <span className="text-red-500">*</span></label>
                  <Input value={gymName} onChange={e => setGymName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Địa chỉ</label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thành phố</label>
                    <Input value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={submit} disabled={saveProfile.isPending} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                    {saveProfile.isPending && <Loader2 className="size-4 animate-spin" />} Lưu hồ sơ
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#0f172a] mb-4"><Eye className="size-4 text-blue-600" /> Hiển thị trên marketplace</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">Cho phép khách hàng tìm thấy phòng gym</p>
                  <p className="text-xs text-gray-400 mt-0.5">Bật để hồ sơ hiển thị công khai trên trang tìm kiếm.</p>
                </div>
                <Switch
                  checked={visible}
                  disabled={saveVisibility.isPending}
                  onCheckedChange={(v) => { setVisible(v); saveVisibility.mutate(v); }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
