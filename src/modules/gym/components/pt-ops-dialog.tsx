"use client";

// Gói 2.D (audit 2026-07-17): dialog vận hành PT cho gym — 4 mảng BE đã đủ nhưng FE = 0:
// B-27 lịch rảnh (UC-028), B-16 phân công (UC-022), B-17 hiệu suất (UC-023), B-29 chặn giờ (UC-029).

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { GymPtResponse } from "@/types/Gym";
import type { AvailabilitySlot, PtAssignmentInput } from "@/types/Trainer";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";

const DAY_LABELS: Record<number, string> = {
  1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật",
};

type Tab = "availability" | "assignments" | "performance" | "blocked";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "availability", label: "Lịch rảnh" },
  { key: "assignments", label: "Phân công" },
  { key: "performance", label: "Hiệu suất" },
  { key: "blocked", label: "Chặn giờ" },
];

export function PtOpsDialog({ pt, onClose }: { pt: GymPtResponse; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("availability");
  const ptId = pt.id!;

  return (
    <Dialog open title={`Vận hành PT — ${pt.displayName ?? pt.username}`} onClose={onClose}>
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "availability" && <AvailabilityTab ptId={ptId} />}
      {tab === "assignments" && <AssignmentsTab ptId={ptId} />}
      {tab === "performance" && <PerformanceTab ptId={ptId} />}
      {tab === "blocked" && <BlockedTab ptId={ptId} />}
    </Dialog>
  );
}

/** UC-028 (B-27): editor lịch rảnh tuần của PT — dayOfWeek 1-7, PUT replace-all. */
function AvailabilityTab({ ptId }: { ptId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["gym-pt", ptId, "availability"],
    queryFn: () => gymService.getPtAvailability(ptId),
  });
  const [rows, setRows] = useState<Array<AvailabilitySlot & { key: number }>>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    setRows(query.data.map((s, i) => ({
      key: i,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime?.slice(0, 5) ?? "",
      endTime: s.endTime?.slice(0, 5) ?? "",
    })));
    setDirty(false);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      gymService.updatePtAvailability(ptId,
        rows.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "availability"] });
      toast({ type: "success", title: "Đã lưu lịch rảnh của PT" });
    },
    onError: (e) => toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) }),
  });

  const invalid = rows.some((r) => !r.startTime || !r.endTime || r.startTime >= r.endTime);

  if (query.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (query.isError) return <p className="text-sm text-red-500">{toErrorMessage(query.error)}</p>;

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có khung giờ — khách không thể đặt PT này.</p>
      )}
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2">
          <select
            value={r.dayOfWeek}
            onChange={(e) => { setRows((p) => p.map((x) => x.key === r.key ? { ...x, dayOfWeek: Number(e.target.value) } : x)); setDirty(true); }}
            className="h-9 w-24 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            {Object.entries(DAY_LABELS).map(([d, label]) => <option key={d} value={d}>{label}</option>)}
          </select>
          <Input type="time" value={r.startTime} className="h-9 w-26 text-sm"
            onChange={(e) => { setRows((p) => p.map((x) => x.key === r.key ? { ...x, startTime: e.target.value } : x)); setDirty(true); }} />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="time" value={r.endTime} className="h-9 w-26 text-sm"
            onChange={(e) => { setRows((p) => p.map((x) => x.key === r.key ? { ...x, endTime: e.target.value } : x)); setDirty(true); }} />
          <button
            onClick={() => { setRows((p) => p.filter((x) => x.key !== r.key)); setDirty(true); }}
            className="p-1.5 text-muted-foreground hover:text-red-600" aria-label="Xóa khung giờ"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      {invalid && <p className="text-xs text-red-500">Giờ bắt đầu phải nhỏ hơn giờ kết thúc.</p>}
      <div className="flex justify-between pt-2">
        <Button
          onClick={() => { setRows((p) => [...p, { key: Date.now(), dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }]); setDirty(true); }}
          className="h-8 gap-1.5 px-3 text-xs bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none"
        >
          <Plus className="size-3.5" /> Thêm khung giờ
        </Button>
        <Button onClick={() => save.mutate()} disabled={!dirty || invalid || save.isPending}
          className="h-8 gap-2 px-3 text-xs bg-primary hover:bg-primary/90 text-white">
          {save.isPending && <Loader2 className="size-3.5 animate-spin" />} Lưu
        </Button>
      </div>
    </div>
  );
}

/** UC-022 (B-16): phân công PT — đúng-một-trong branch/service/package. */
function AssignmentsTab({ ptId }: { ptId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [targetType, setTargetType] = useState<"branch" | "service" | "package">("branch");
  const [targetId, setTargetId] = useState("");

  const assignments = useQuery({
    queryKey: ["gym-pt", ptId, "assignments"],
    queryFn: () => gymService.listPtAssignments(ptId),
  });
  const branches = useQuery({ queryKey: ["gym-branches"], queryFn: gymService.listOwnBranches });
  const services = useQuery({ queryKey: ["gym-services"], queryFn: gymService.listOwnServices });
  const packages = useQuery({ queryKey: ["gym-packages"], queryFn: gymService.listOwnPackages });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "assignments"] });

  const add = useMutation({
    mutationFn: () => {
      const payload: PtAssignmentInput = {};
      if (targetType === "branch") payload.branchId = Number(targetId);
      if (targetType === "service") payload.serviceId = Number(targetId);
      if (targetType === "package") payload.packageId = Number(targetId);
      return gymService.addPtAssignment(ptId, payload);
    },
    onSuccess: () => { invalidate(); setTargetId(""); toast({ type: "success", title: "Đã phân công PT" }); },
    onError: (e) => toast({ type: "error", title: "Phân công thất bại", description: toErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: (assignmentId: number) => gymService.removePtAssignment(ptId, assignmentId),
    onSuccess: () => { invalidate(); toast({ type: "success", title: "Đã gỡ phân công" }); },
    // BE chặn gỡ khi PT còn booking tương lai (P1-16) — hiện nguyên văn lý do.
    onError: (e) => toast({ type: "error", title: "Gỡ thất bại", description: toErrorMessage(e) }),
  });

  const options =
    targetType === "branch" ? (branches.data ?? []).map((b) => ({ id: b.id, name: b.name }))
      : targetType === "service" ? (services.data ?? []).map((s) => ({ id: s.id, name: s.name }))
        : (packages.data ?? []).map((p) => ({ id: p.id, name: p.name }));

  if (assignments.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (assignments.isError) return <p className="text-sm text-red-500">{toErrorMessage(assignments.error)}</p>;

  return (
    <div className="space-y-3">
      {!(assignments.data ?? []).length ? (
        <p className="text-sm text-muted-foreground">Chưa có phân công — PT chưa gắn với chi nhánh/dịch vụ/gói nào.</p>
      ) : (
        <ul className="space-y-2">
          {(assignments.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              <span className="text-foreground">
                {a.branchName ? `Chi nhánh: ${a.branchName}` : a.serviceName ? `Dịch vụ: ${a.serviceName}` : `Gói: ${a.packageName}`}
              </span>
              <button
                onClick={() => a.id != null && remove.mutate(a.id)}
                disabled={remove.isPending}
                className="p-1.5 text-muted-foreground hover:text-red-600 shrink-0" aria-label="Gỡ phân công"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Thêm phân công (đúng một đích)</p>
        <div className="flex gap-2">
          <select
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value as typeof targetType); setTargetId(""); }}
            className="h-9 w-32 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="branch">Chi nhánh</option>
            <option value="service">Dịch vụ</option>
            <option value="package">Gói tập</option>
          </select>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="">— Chọn —</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <Button onClick={() => add.mutate()} disabled={!targetId || add.isPending}
            className="h-9 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90 text-white">
            {add.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}

/** UC-023 (B-17): hiệu suất PT. */
function PerformanceTab({ ptId }: { ptId: number }) {
  const query = useQuery({
    queryKey: ["gym-pt", ptId, "performance"],
    queryFn: () => gymService.getPtPerformance(ptId),
  });

  if (query.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (query.isError) return <p className="text-sm text-red-500">{toErrorMessage(query.error)}</p>;

  const p = query.data;
  const stats = [
    { label: "Điểm đánh giá", value: p?.averageRating != null ? `${Number(p.averageRating).toFixed(1)} ★ (${p.reviewCount ?? 0})` : "Chưa có" },
    { label: "Buổi hoàn tất", value: String(p?.completedBookings ?? 0) },
    { label: "Buổi bị hủy", value: String(p?.cancelledBookings ?? 0) },
    { label: "Khách vắng mặt", value: String(p?.noShowBookings ?? 0) },
    { label: "Tranh chấp liên quan", value: String(p?.disputes ?? 0) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/** UC-029 (B-29): thời gian chặn của PT do gym quản lý. */
function BlockedTab({ ptId }: { ptId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["gym-pt", ptId, "blocked"],
    queryFn: () => gymService.listBlockedTimes({ ptId }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "blocked"] });

  const create = useMutation({
    mutationFn: () => gymService.createBlockedTime({ ptId, startAt: start + ":00", endAt: end + ":00", reason: reason.trim() || undefined }),
    onSuccess: () => { invalidate(); setStart(""); setEnd(""); setReason(""); toast({ type: "success", title: "Đã thêm khoảng chặn" }); },
    // BE chặn tạo blocked time đè booking HOLDING (P1-15).
    onError: (e) => toast({ type: "error", title: "Thêm thất bại", description: toErrorMessage(e) }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => gymService.deleteBlockedTime(id),
    onSuccess: () => { invalidate(); toast({ type: "success", title: "Đã xóa khoảng chặn" }); },
    onError: (e) => toast({ type: "error", title: "Xóa thất bại", description: toErrorMessage(e) }),
  });

  if (query.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (query.isError) return <p className="text-sm text-red-500">{toErrorMessage(query.error)}</p>;

  return (
    <div className="space-y-3">
      {!(query.data ?? []).length ? (
        <p className="text-sm text-muted-foreground">Chưa có khoảng chặn nào cho PT này.</p>
      ) : (
        <ul className="space-y-2">
          {(query.data ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {new Date(b.startAt).toLocaleString("vi-VN")} → {new Date(b.endAt).toLocaleString("vi-VN")}
                </p>
                {b.reason && <p className="text-xs text-muted-foreground truncate">{b.reason}</p>}
              </div>
              <button onClick={() => b.id != null && remove.mutate(b.id)} disabled={remove.isPending}
                className="p-1.5 text-muted-foreground hover:text-red-600 shrink-0" aria-label="Xóa khoảng chặn">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="text-sm" />
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="text-sm" />
        </div>
        <Input value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} placeholder="Lý do (không bắt buộc)" className="text-sm" />
        <Button
          onClick={() => {
            if (!start || !end || start >= end) { toast({ type: "warning", title: "Khoảng thời gian không hợp lệ" }); return; }
            create.mutate();
          }}
          disabled={create.isPending}
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-white text-sm"
        >
          {create.isPending && <Loader2 className="size-4 animate-spin" />} Thêm khoảng chặn
        </Button>
      </div>
    </div>
  );
}
