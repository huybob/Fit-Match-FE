"use client";

import { useMemo } from "react";
import type { PtSlotCell } from "@/types/Ticket";
import { cn } from "@/shared/utils/cn.util";

export interface PtGridSelection {
  ptProfileId: number;
  ptName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
}

interface PtAvailabilityGridProps {
  cells: PtSlotCell[];
  /** Ô đang chọn — so khớp theo (pt, ngày, giờ bắt đầu). */
  selected?: PtGridSelection | null;
  onSelect: (selection: PtGridSelection) => void;
  /** Ẩn cột PT khi lưới đã lọc sẵn một PT (chế độ "chọn PT trước"). */
  showPtColumn?: boolean;
  emptyLabel: string;
  takenLabel: string;
  loading?: boolean;
}

/**
 * Lưới ngày × giờ để chọn khung PT. Đây là component TRÌNH BÀY THUẦN — không tự
 * gọi API. Bên gọi quyết định lấy dữ liệu theo chiều nào:
 *
 * - chọn giờ trước  -> truyền kết quả /pt-availability/search (đã lọc theo giờ)
 * - chọn PT trước   -> truyền /pt-availability/grid?ptId=...
 * - xem toàn chi nhánh -> /pt-availability/grid không có ptId
 *
 * Tách như vậy vì R7: đây là chỗ dễ rối nhất của FE, và logic hiển thị lưới
 * không nên phụ thuộc vào việc dữ liệu đến từ endpoint nào.
 */
export function PtAvailabilityGrid({
  cells,
  selected,
  onSelect,
  showPtColumn = true,
  emptyLabel,
  takenLabel,
  loading = false,
}: PtAvailabilityGridProps) {
  /** Gom theo ngày rồi theo giờ — một PT có thể khai nhiều khung trong cùng ngày. */
  const byDate = useMemo(() => {
    const map = new Map<string, PtSlotCell[]>();
    for (const cell of cells) {
      const list = map.get(cell.date) ?? [];
      list.push(cell);
      map.set(cell.date, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({
        date,
        slots: [...slots].sort(
          (a, b) =>
            a.startTime.localeCompare(b.startTime) ||
            (a.ptName ?? "").localeCompare(b.ptName ?? ""),
        ),
      }));
  }, [cells]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (byDate.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {byDate.map(({ date, slots }) => (
        <div key={date} className="space-y-2">
          <p className="text-sm font-medium">{formatDate(date)}</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const isSelected =
                selected?.ptProfileId === slot.ptProfileId &&
                selected?.date === slot.date &&
                selected?.startTime === slot.startTime;
              return (
                <button
                  key={`${slot.ptProfileId}-${slot.date}-${slot.startTime}`}
                  type="button"
                  // Ô đã có người đặt vẫn hiển thị (để khách thấy PT bận lúc nào)
                  // nhưng mờ và không bấm được.
                  disabled={slot.taken}
                  aria-pressed={isSelected}
                  title={slot.taken ? takenLabel : undefined}
                  onClick={() =>
                    onSelect({
                      ptProfileId: slot.ptProfileId,
                      ptName: slot.ptName,
                      date: slot.date,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                    })
                  }
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition",
                    slot.taken && "cursor-not-allowed opacity-40",
                    !slot.taken && "hover:border-primary hover:bg-primary/5",
                    isSelected && "border-primary bg-primary/10 font-medium",
                  )}
                >
                  <span className="block tabular-nums">
                    {trimSeconds(slot.startTime)}–{trimSeconds(slot.endTime)}
                  </span>
                  {showPtColumn && slot.ptName ? (
                    <span className="block text-xs text-muted-foreground">{slot.ptName}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** BE trả "18:00:00"; lưới chỉ cần giờ:phút. */
function trimSeconds(time: string) {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
}
