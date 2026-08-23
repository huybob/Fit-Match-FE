"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, UserRound } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn.util";
import { usePtSlotGrid, usePtSlotSearch } from "../hooks/use-ticket";
import type { PtGridSelection } from "./pt-availability-grid";

type Direction = "byPt" | "byTime";

interface DayComposerProps {
  branchId: number;
  date: string;
  dayIndex: number;
  selected: PtGridSelection | null;
  onSelect: (selection: PtGridSelection) => void;
  onClear: () => void;
  onClose: () => void;
  loadingCells?: boolean;
  /**
   * PT khách đang nhắm tới (đi từ nút "Đặt lịch với PT này"). Chỉ ĐƯA LÊN ĐẦU,
   * không lọc bỏ những người khác: PT đó kín ngày này thì khách vẫn cần thấy
   * người thay thế ngay tại đây, chứ không phải một hộp thoại trống.
   */
  preferredPtId?: number;
}

/**
 * Chọn PT + khung giờ cho MỘT ngày, theo hai chiều:
 *
 * - "Theo PT"  — liệt kê PT rảnh trong ngày, mở ra là các khung của PT đó.
 * - "Theo giờ" — chọn khung trước, hiện PT nào còn trống đúng khung ấy.
 *
 * Hai chiều dùng hai endpoint khác nhau ({@code /pt-availability/grid} và
 * {@code /pt-availability/search}) nhưng cùng đổ về một {@link PtGridSelection},
 * nên phần còn lại của trang không cần biết khách đã đi đường nào.
 */
export function DayComposer({
  branchId,
  date,
  dayIndex,
  selected,
  onSelect,
  onClear,
  onClose,
  preferredPtId = 0,
}: DayComposerProps) {
  const t = useTranslations("ticket.schedule");
  const [direction, setDirection] = useState<Direction>("byPt");
  const [pickedTime, setPickedTime] = useState<string>("");

  const { data: cells, isLoading } = usePtSlotGrid(branchId, date, date);
  const free = useMemo(() => (cells ?? []).filter((c) => !c.taken), [cells]);

  /** Khung giờ có thật trong ngày — cột giờ cố định sẽ bỏ sót khung lẻ như 18:30. */
  const times = useMemo(
    () => [...new Set(free.map((c) => c.startTime))].sort(),
    [free],
  );

  const byPt = useMemo(() => {
    const map = new Map<number, { name: string; cells: typeof free }>();
    for (const cell of free) {
      const entry = map.get(cell.ptProfileId) ?? {
        name: cell.ptName ?? `#${cell.ptProfileId}`,
        cells: [] as typeof free,
      };
      entry.cells.push(cell);
      map.set(cell.ptProfileId, entry);
    }
    return [...map]
      .map(([id, value]) => ({ id, ...value }))
      // PT khách đang nhắm lên đầu; phần còn lại giữ nguyên thứ tự của server.
      .sort((a, b) => Number(b.id === preferredPtId) - Number(a.id === preferredPtId));
  }, [free, preferredPtId]);

  const { data: atTime, isLoading: timeLoading } = usePtSlotSearch(
    branchId,
    date,
    pickedTime,
    direction === "byTime" && Boolean(pickedTime),
  );

  function choose(cell: (typeof free)[number]) {
    onSelect({
      ptProfileId: cell.ptProfileId,
      ptName: cell.ptName,
      date: cell.date,
      startTime: cell.startTime,
      endTime: cell.endTime,
    });
    onClose();
  }

  return (
    <Dialog open onClose={onClose} title={t("dayDialogTitle", { index: dayIndex, date })}>
      <div className="space-y-4">
        {selected ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
            <span className="font-medium">
              {selected.ptName} · {selected.startTime.slice(0, 5)}–{selected.endTime.slice(0, 5)}
            </span>
            <Button variant="ghost" size="sm" onClick={onClear}>
              {t("clearPt")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("pickPtOptional")}</p>
        )}

        <div className="flex rounded-md border border-border p-0.5">
          {(["byPt", "byTime"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDirection(option)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                direction === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "byPt" ? <UserRound className="size-3.5" /> : <Clock className="size-3.5" />}
              {t(option === "byPt" ? "byPt" : "byTime")}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("loadingSlots")}</p>
        ) : !free.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noSlots")}</p>
        ) : direction === "byPt" ? (
          <ul className="space-y-2">
            {byPt.map((pt) => (
              <li
                key={pt.id}
                className={cn(
                  "rounded-md border p-3",
                  pt.id === preferredPtId ? "border-primary/60 bg-primary/5" : "border-border",
                )}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {pt.name}
                  {pt.id === preferredPtId ? (
                    <Badge variant="outline">{t("preferredPt")}</Badge>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pt.cells.map((cell) => {
                    const active =
                      selected?.ptProfileId === cell.ptProfileId &&
                      selected?.startTime === cell.startTime;
                    return (
                      <button
                        key={`${cell.ptProfileId}-${cell.startTime}`}
                        type="button"
                        onClick={() => choose(cell)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary hover:text-primary",
                        )}
                      >
                        {cell.startTime.slice(0, 5)}–{cell.endTime.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {times.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setPickedTime(time)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    pickedTime === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {time.slice(0, 5)}
                </button>
              ))}
            </div>

            {!pickedTime ? (
              <p className="text-sm text-muted-foreground">{t("pickTimeFirst")}</p>
            ) : timeLoading ? (
              <p className="text-sm text-muted-foreground">{t("loadingSlots")}</p>
            ) : !(atTime ?? []).length ? (
              <p className="text-sm text-muted-foreground">{t("noPtAtTime")}</p>
            ) : (
              <ul className="space-y-2">
                {(atTime ?? []).map((cell) => (
                  <li
                    key={`${cell.ptProfileId}-${cell.startTime}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{cell.ptName}</p>
                      <p className="text-xs text-muted-foreground">
                        {cell.startTime.slice(0, 5)}–{cell.endTime.slice(0, 5)}
                      </p>
                    </div>
                    {cell.ptAvgRating ? (
                      <Badge variant="outline">{cell.ptAvgRating.toFixed(1)}</Badge>
                    ) : null}
                    <Button size="sm" onClick={() => choose(cell)}>
                      {t("choosePt")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
