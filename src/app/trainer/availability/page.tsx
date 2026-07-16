"use client";

// B-26/B-28 (audit 2026-07-17, UC-028/029): trang thật thay placeholder "đang phát triển".
// - Lịch rảnh hằng tuần: dayOfWeek 1-7 (1 = Thứ 2) khớp BE — schema cũ 0-6 lệch 1 ngày.
// - PUT /pt/availability thay TOÀN BỘ lịch (replace-all); BE chặn thu hẹp đè booking (409).
// - Thời gian chặn cá nhân (blocked time): tạo/xóa từng khoảng.

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import {
  useCreateMyBlockedTime,
  useDeleteMyBlockedTime,
  useMyAvailability,
  useMyBlockedTimes,
  useUpdateMyAvailability,
} from "@/modules/trainer/hooks/use-trainer";
import type { AvailabilitySlot } from "@/types/Trainer";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";

const DAY_LABELS: Record<number, string> = {
  1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật",
};

type Row = AvailabilitySlot & { key: number };
let rowKey = 0;

export default function TrainerAvailabilityPage() {
  const { toast } = useToast();
  const availability = useMyAvailability();
  const updateAvailability = useUpdateMyAvailability();
  const blocked = useMyBlockedTimes();
  const createBlocked = useCreateMyBlockedTime();
  const deleteBlocked = useDeleteMyBlockedTime();

  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (!availability.data) return;
    setRows(availability.data.map((s) => ({
      key: rowKey++,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime?.slice(0, 5) ?? "",
      endTime: s.endTime?.slice(0, 5) ?? "",
    })));
    setDirty(false);
  }, [availability.data]);

  function addRow() {
    setRows((prev) => [...prev, { key: rowKey++, dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }]);
    setDirty(true);
  }
  function patchRow(key: number, patch: Partial<AvailabilitySlot>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setDirty(true);
  }
  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setDirty(true);
  }

  const invalid = rows.some((r) => !r.startTime || !r.endTime || r.startTime >= r.endTime);

  async function saveAvailability() {
    try {
      await updateAvailability.mutateAsync(
        rows.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
      );
      toast({ type: "success", title: "Đã lưu lịch rảnh" });
    } catch (e) {
      // BE chặn thu hẹp lịch đè booking HOLDING tương lai (P1-15) — hiện nguyên văn.
      toast({ type: "error", title: "Lưu thất bại", description: toErrorMessage(e) });
    }
  }

  async function addBlockedTime() {
    if (!blockStart || !blockEnd || blockStart >= blockEnd) {
      toast({ type: "warning", title: "Khoảng thời gian chặn không hợp lệ" });
      return;
    }
    try {
      await createBlocked.mutateAsync({
        startAt: blockStart + ":00",
        endAt: blockEnd + ":00",
        reason: blockReason.trim() || undefined,
      });
      setBlockStart(""); setBlockEnd(""); setBlockReason("");
      toast({ type: "success", title: "Đã thêm thời gian chặn" });
    } catch (e) {
      toast({ type: "error", title: "Thêm thất bại", description: toErrorMessage(e) });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Lịch làm việc</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Khách chỉ đặt được trong khung giờ rảnh hằng tuần của bạn; thời gian chặn loại trừ các khoảng bận đột xuất.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Lịch rảnh hằng tuần */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarClock className="size-4 text-primary" /> Lịch rảnh hằng tuần
            </h2>
            <Button onClick={addRow} className="h-8 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90 text-white">
              <Plus className="size-3.5" /> Thêm khung giờ
            </Button>
          </div>

          {availability.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : availability.isError ? (
            <p className="text-sm text-red-500">{toErrorMessage(availability.error)}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Chưa có khung giờ rảnh — khách không thể đặt lịch với bạn.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <select
                    value={r.dayOfWeek}
                    onChange={(e) => patchRow(r.key, { dayOfWeek: Number(e.target.value) })}
                    className="h-9 w-28 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
                  >
                    {Object.entries(DAY_LABELS).map(([d, label]) => (
                      <option key={d} value={d}>{label}</option>
                    ))}
                  </select>
                  <Input type="time" value={r.startTime} className="h-9 w-28 text-sm"
                    onChange={(e) => patchRow(r.key, { startTime: e.target.value })} />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input type="time" value={r.endTime} className="h-9 w-28 text-sm"
                    onChange={(e) => patchRow(r.key, { endTime: e.target.value })} />
                  <button onClick={() => removeRow(r.key)} className="p-1.5 text-muted-foreground hover:text-red-600" aria-label="Xóa khung giờ">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {invalid && <p className="mt-2 text-xs text-red-500">Mỗi khung giờ cần giờ bắt đầu &lt; giờ kết thúc.</p>}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={saveAvailability}
              disabled={!dirty || invalid || updateAvailability.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              {updateAvailability.isPending && <Loader2 className="size-4 animate-spin" />} Lưu lịch rảnh
            </Button>
          </div>
        </section>

        {/* Thời gian chặn */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">Thời gian chặn (bận đột xuất)</h2>

          {blocked.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : blocked.isError ? (
            <p className="text-sm text-red-500">{toErrorMessage(blocked.error)}</p>
          ) : !(blocked.data ?? []).length ? (
            <p className="text-sm text-muted-foreground py-2">Chưa có khoảng chặn nào.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {(blocked.data ?? []).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-foreground">
                      {new Date(b.startAt).toLocaleString("vi-VN")} → {new Date(b.endAt).toLocaleString("vi-VN")}
                    </p>
                    {b.reason && <p className="text-xs text-muted-foreground truncate">{b.reason}</p>}
                  </div>
                  <button
                    onClick={() => b.id != null && deleteBlocked.mutate(b.id, {
                      onError: (e) => toast({ type: "error", title: "Xóa thất bại", description: toErrorMessage(e) }),
                    })}
                    disabled={deleteBlocked.isPending}
                    className="p-1.5 text-muted-foreground hover:text-red-600 shrink-0"
                    aria-label="Xóa khoảng chặn"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Thêm khoảng chặn mới</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Từ</label>
                <Input type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Đến</label>
                <Input type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="text-sm" />
              </div>
            </div>
            <Input value={blockReason} maxLength={255} onChange={(e) => setBlockReason(e.target.value)} placeholder="Lý do (không bắt buộc)" className="text-sm" />
            <Button onClick={addBlockedTime} disabled={createBlocked.isPending} className="h-9 gap-2 bg-primary hover:bg-primary/90 text-white text-sm">
              {createBlocked.isPending && <Loader2 className="size-4 animate-spin" />} Thêm khoảng chặn
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
