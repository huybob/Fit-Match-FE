"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Loader2, Tag } from "lucide-react";
import { adminService } from "@/services/admin.service";
import type {
  ServiceCategoryResponse, ServiceCategoryRequest,
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
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Tag className="size-4 text-primary" /> Danh mục dịch vụ</h2>
        <Button onClick={openCreate} className="gap-2 h-8 text-xs bg-primary hover:bg-primary/90 text-white"><Plus className="size-3.5" /> Thêm</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : cats.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Chưa có danh mục.</p>
      ) : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="pb-2 text-left">Tên</th><th className="pb-2 text-left">Mô tả</th><th className="pb-2 text-left">Trạng thái</th><th className="pb-2 text-right">Sửa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cats.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 font-semibold text-foreground">{c.name}</td>
                <td className="py-2.5 text-xs text-muted-foreground">{c.description || "—"}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.active === false ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700"}`}>
                    {c.active === false ? "Tắt" : "Bật"}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => openEdit(c)} className="text-primary hover:text-primary"><Pencil className="size-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <Dialog open={open} title={editing ? "Sửa danh mục dịch vụ" : "Thêm danh mục dịch vụ"} onClose={close}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Yoga, Gym, Boxing" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="size-4 accent-[#2563eb]" /> Đang kích hoạt
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={close} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">Hủy</Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">{save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}


export default function AdminMasterDataPage() {
  // E-8 (quyết định 2026-07-17): section "Cấu hình hệ thống" đã gỡ — kho key-value
  // write-only, không logic BE nào đọc (tham số thật ở Commission + BookingRules).
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dữ liệu hệ thống</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý danh mục dịch vụ dùng chung cho toàn nền tảng.</p>
      </div>
      <ServiceCategories />
    </div>
  );
}
