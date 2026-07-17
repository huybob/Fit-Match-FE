"use client";

import { formatCurrency } from "@/utils/format.util";
// Gói 2.C (audit 2026-07-17):
// - B-21/BE-7: select danh mục từ /gym/service-categories (trước đây update luôn ghi category=null).
// - B-22: durationMinutes bắt buộc (BE @NotNull) — hết 400 khó hiểu.
// - B-23 (UC-026): dialog quy tắc đặt lịch (cọc/hủy/đặt trước).
// - B-24 (UC-027): trạng thái catalog PUBLISHED/HIDDEN/PAUSED/ARCHIVED thay nút "Vô hiệu hoá" một chiều.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Sparkles, Clock, Loader2, SlidersHorizontal } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { CatalogStatus, GymServiceInput, GymServiceResponse } from "@/types/Gym";
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

export default function GymServicesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymServiceResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [eligibilityNotes, setEligibilityNotes] = useState("");
  const [rulesTarget, setRulesTarget] = useState<GymServiceResponse | null>(null);

  const { data: services = [], isLoading, isError, error } = useQuery({
    queryKey: ["gym-services"],
    queryFn: gymService.listOwnServices
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["gym-service-categories"],
    queryFn: gymService.listServiceCategories,
  });

  const saveMut = useMutation({
    mutationFn: (payload: GymServiceInput) =>
      editing?.id != null
        ? gymService.editService(editing.id, payload)
        : gymService.addService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-services"] });
      closeForm();
      toast({ type: "success", title: editing ? "Đã cập nhật dịch vụ" : "Đã thêm dịch vụ" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) })
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CatalogStatus }) =>
      gymService.updateServiceCatalogStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-services"] });
      toast({ type: "success", title: "Đã đổi trạng thái dịch vụ" });
    },
    onError: (e) => toast({ type: "error", title: "Thao tác thất bại", description: toErrorMessage(e) })
  });

  function openCreate() {
    setEditing(null); setName(""); setDescription(""); setPrice(""); setDuration("");
    setCategoryId(""); setEligibilityNotes(""); setFormOpen(true);
  }
  function openEdit(s: GymServiceResponse) {
    setEditing(s); setName(s.name ?? ""); setDescription(s.description ?? "");
    setPrice(s.price != null ? String(s.price) : ""); setDuration(s.durationMinutes != null ? String(s.durationMinutes) : "");
    setCategoryId(s.categoryId != null ? String(s.categoryId) : "");
    setEligibilityNotes(s.eligibilityNotes ?? "");
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }
  function save() {
    if (!name.trim()) { toast({ type: "warning", title: "Vui lòng nhập tên dịch vụ" }); return; }
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      toast({ type: "warning", title: "Vui lòng nhập giá hợp lệ" }); return;
    }
    // B-22: BE @NotNull @Positive — validate ngay tại client.
    if (!duration.trim() || Number(duration) <= 0) {
      toast({ type: "warning", title: "Vui lòng nhập thời lượng (phút) — bắt buộc để giữ chỗ khung giờ" }); return;
    }
    saveMut.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      durationMinutes: Number(duration),
      categoryId: categoryId ? Number(categoryId) : undefined,
      eligibilityNotes: eligibilityNotes.trim() || undefined,
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dịch vụ</h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý dịch vụ, giá, thời lượng, quy tắc đặt lịch và trạng thái hiển thị.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="size-4" /> Thêm dịch vụ
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-card rounded-2xl border border-border">
            <p className="text-sm">{toErrorMessage(error)}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
            <Sparkles className="size-10 mb-3" />
            <p className="text-sm">Chưa có dịch vụ nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-5 text-primary" />
                  </div>
                  <CatalogStatusBadge status={s.status} />
                </div>
                <h3 className="text-[15px] font-bold text-foreground">{s.name}</h3>
                {s.categoryName && (
                  <p className="text-[11px] font-semibold text-primary mt-0.5">{s.categoryName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{s.description || "Không có mô tả."}</p>
                {s.bookingRules && (s.bookingRules.depositPercent != null || s.bookingRules.freeCancellationHours != null || s.bookingRules.minNoticeHours != null) && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {[
                      s.bookingRules.depositPercent != null ? `Cọc ${s.bookingRules.depositPercent}%` : null,
                      s.bookingRules.freeCancellationHours != null ? `Hủy miễn phí trước ${s.bookingRules.freeCancellationHours}h` : null,
                      s.bookingRules.minNoticeHours != null ? `Đặt trước ≥ ${s.bookingRules.minNoticeHours}h` : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-base font-extrabold text-primary">{vnd(s.price)}</span>
                  {s.durationMinutes != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {s.durationMinutes} phút
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button onClick={() => openEdit(s)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <Pencil className="size-3.5" /> Sửa
                  </button>
                  <button onClick={() => setRulesTarget(s)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <SlidersHorizontal className="size-3.5" /> Quy tắc
                  </button>
                  <div className="ml-auto">
                    <CatalogStatusMenu
                      status={s.status}
                      pending={statusMut.isPending}
                      onChange={(next) => s.id != null && statusMut.mutate({ id: s.id, status: next })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} title={editing ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ"} onClose={closeForm}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên dịch vụ <span className="text-red-500">*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Buổi tập PT 1-1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả dịch vụ..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Giá (₫) <span className="text-red-500">*</span></label>
              <Input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="500000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Thời lượng (phút) <span className="text-red-500">*</span></label>
              <Input value={duration} onChange={e => setDuration(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="60" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Danh mục</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 text-sm border border-border rounded-lg px-2.5 bg-card text-foreground"
            >
              <option value="">— Không phân loại —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Điều kiện tham gia / đối tượng phù hợp</label>
            <Textarea value={eligibilityNotes} onChange={e => setEligibilityNotes(e.target.value)} rows={2} placeholder="Vd: Phù hợp người mới bắt đầu, không dành cho phụ nữ mang thai..." />
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
          onSave={(rules) => gymService.updateServiceBookingRules(rulesTarget.id!, rules)}
          onClose={() => setRulesTarget(null)}
        />
      )}
    </main>
  );
}
