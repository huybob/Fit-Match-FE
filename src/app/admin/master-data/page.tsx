"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Loader2, Tag, Settings2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import type {
  ServiceCategoryResponse, ServiceCategoryRequest,
  SystemConfigResponse, SystemConfigRequest,
} from "@/types/Admin";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";

function ServiceCategories() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategoryResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin", "service-categories"],
    queryFn: adminService.listServiceCategories,
  });

  const save = useMutation({
    mutationFn: (payload: ServiceCategoryRequest) =>
      editing?.id != null
        ? adminService.updateServiceCategory(editing.id, payload)
        : adminService.createServiceCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "service-categories"] });
      close();
      toast({ type: "success", title: "Đã lưu danh mục" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  function openCreate() { setEditing(null); setName(""); setDescription(""); setActive(true); setOpen(true); }
  function openEdit(c: ServiceCategoryResponse) { setEditing(c); setName(c.name ?? ""); setDescription(c.description ?? ""); setActive(c.active ?? true); setOpen(true); }
  function close() { setOpen(false); setEditing(null); }
  function submit() {
    if (!name.trim()) { toast({ type: "warning", title: "Nhập tên danh mục" }); return; }
    save.mutate({ name: name.trim(), description: description.trim() || undefined, active });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#191b23]"><Tag className="size-4 text-blue-600" /> Danh mục dịch vụ</h2>
        <Button onClick={openCreate} className="gap-2 h-8 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] text-white"><Plus className="size-3.5" /> Thêm</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-gray-400" /></div>
      ) : cats.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">Chưa có danh mục.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="pb-2 text-left">Tên</th><th className="pb-2 text-left">Mô tả</th><th className="pb-2 text-left">Trạng thái</th><th className="pb-2 text-right">Sửa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cats.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 font-semibold text-[#191b23]">{c.name}</td>
                <td className="py-2.5 text-xs text-gray-500">{c.description || "—"}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.active === false ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-700"}`}>
                    {c.active === false ? "Tắt" : "Bật"}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => openEdit(c)} className="text-[#2563eb] hover:text-[#1d4ed8]"><Pencil className="size-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={open} title={editing ? "Sửa danh mục dịch vụ" : "Thêm danh mục dịch vụ"} onClose={close}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Yoga, Gym, Boxing" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="size-4 accent-[#2563eb]" /> Đang kích hoạt
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={close} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">Hủy</Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">{save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function SystemConfigs() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [configKey, setConfigKey] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [description, setDescription] = useState("");
  const [editingKey, setEditingKey] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin", "system-configs"],
    queryFn: adminService.listSystemConfigs,
  });

  const save = useMutation({
    mutationFn: (payload: SystemConfigRequest) => adminService.upsertSystemConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system-configs"] });
      setOpen(false);
      toast({ type: "success", title: "Đã lưu cấu hình" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  function openCreate() { setEditingKey(false); setConfigKey(""); setConfigValue(""); setDescription(""); setOpen(true); }
  function openEdit(c: SystemConfigResponse) { setEditingKey(true); setConfigKey(c.configKey ?? ""); setConfigValue(c.configValue ?? ""); setDescription(c.description ?? ""); setOpen(true); }
  function submit() {
    if (!configKey.trim() || !configValue.trim()) { toast({ type: "warning", title: "Nhập key và value" }); return; }
    save.mutate({ configKey: configKey.trim(), configValue: configValue.trim(), description: description.trim() || undefined });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#191b23]"><Settings2 className="size-4 text-blue-600" /> Cấu hình hệ thống</h2>
        <Button onClick={openCreate} className="gap-2 h-8 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] text-white"><Plus className="size-3.5" /> Thêm / Sửa</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-gray-400" /></div>
      ) : configs.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">Chưa có cấu hình.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="pb-2 text-left">Key</th><th className="pb-2 text-left">Giá trị</th><th className="pb-2 text-left">Mô tả</th><th className="pb-2 text-right">Sửa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {configs.map((c) => (
              <tr key={c.id ?? c.configKey}>
                <td className="py-2.5 font-mono text-xs font-semibold text-[#191b23]">{c.configKey}</td>
                <td className="py-2.5 text-xs text-gray-700">{c.configValue}</td>
                <td className="py-2.5 text-xs text-gray-500">{c.description || "—"}</td>
                <td className="py-2.5 text-right">
                  <button onClick={() => openEdit(c)} className="text-[#2563eb] hover:text-[#1d4ed8]"><Pencil className="size-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={open} title={editingKey ? "Cập nhật cấu hình" : "Thêm cấu hình"} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Key <span className="text-red-500">*</span></label>
            <Input value={configKey} onChange={e => setConfigKey(e.target.value)} disabled={editingKey} placeholder="vd: booking.max_per_day" className="font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Giá trị <span className="text-red-500">*</span></label>
            <Input value={configValue} onChange={e => setConfigValue(e.target.value)} placeholder="vd: 10" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">Hủy</Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">{save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function AdminMasterDataPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#191b23]">Dữ liệu hệ thống</h1>
        <p className="text-sm text-gray-400 mt-0.5">Quản lý danh mục dịch vụ và tham số cấu hình toàn hệ thống.</p>
      </div>
      <ServiceCategories />
      <SystemConfigs />
    </div>
  );
}
