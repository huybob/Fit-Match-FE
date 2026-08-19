"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { addDays, isoWeekday, startOfWeek, todayIso } from "@/modules/ticket/calendar-date.util";
import { weekdayShortKey } from "@/shared/utils/enum-label.util";
import { shiftKeys } from "../shift-query-keys";
import { AssignShiftDialog } from "./assign-shift-dialog";
import type { ShiftRosterCell } from "@/types/Shift";

const WEEK_DAYS = 7;

interface ShiftRosterProps {
  branchId: number;
}

/**
 * Lưới phân ca: hàng = PT, cột = ngày, ô = các ca.
 *
 * BE trả danh sách ô PHẲNG và FE gom lại ở đây — cùng một dữ liệu dựng được cả
 * tuần lẫn tháng mà không cần hai endpoint.
 *
 * Bố cục bám {@code CalendarBoard} của màn đặt lịch (khung bo tròn, thanh điều
 * hướng có nút "Hôm nay", hàng thứ in hoa) để Gym không phải học hai kiểu lịch
 * khác nhau trong cùng một sản phẩm.
 *
 * Ô hiển thị hai tín hiệu mà Gym cần TRƯỚC khi bấm gỡ ca: PT có đơn nghỉ đã
 * duyệt, và số buổi khách đã đặt — gỡ ca đang có khách sẽ bị BE từ chối, thấy
 * trước thì đỡ phải thử rồi mới biết.
 */
export function ShiftRoster({ branchId }: ShiftRosterProps) {
  const t = useTranslations("gymRoster");
  const tc = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();

  // Mốc tuần giữ dạng chuỗi ISO ngày và đi qua calendar-date.util: tự tính bằng
  // Date + toISOString() sẽ lùi một ngày ở UTC+7 (nửa đêm giờ máy = 17:00 UTC
  // hôm trước), khiến lưới bắt đầu từ Chủ nhật thay vì Thứ hai.
  const today = todayIso();
  const [anchor, setAnchor] = useState(() => startOfWeek(today));
  const [assignOpen, setAssignOpen] = useState(false);

  const from = anchor;
  const to = useMemo(() => addDays(anchor, WEEK_DAYS - 1), [anchor]);
  const dates = useMemo(
    () => Array.from({ length: WEEK_DAYS }, (_, index) => addDays(anchor, index)),
    [anchor],
  );

  const { data: cells, isLoading } = useQuery({
    queryKey: shiftKeys.roster(branchId, from, to),
    queryFn: () => shiftService.roster(branchId, from, to),
    enabled: branchId > 0,
  });

  const unassign = useMutation({
    mutationFn: (cell: ShiftRosterCell) =>
      shiftService.unassignShift(cell.ptProfileId, cell.assignmentId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: shiftKeys.all });
      toast({ type: "success", title: t("removed") });
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  /** Gom ô phẳng thành lưới: ptId -> date -> ô. */
  const grid = useMemo(() => {
    const pts = new Map<number, { name: string; byDate: Map<string, ShiftRosterCell[]> }>();
    for (const cell of cells ?? []) {
      const entry = pts.get(cell.ptProfileId) ?? {
        name: cell.ptName ?? `#${cell.ptProfileId}`,
        byDate: new Map<string, ShiftRosterCell[]>(),
      };
      const list = entry.byDate.get(cell.date) ?? [];
      list.push(cell);
      entry.byDate.set(cell.date, list);
      pts.set(cell.ptProfileId, entry);
    }
    return [...pts]
      .map(([ptProfileId, value]) => ({ ptProfileId, ...value }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [cells]);

  /** Tổng quan tuần — Gym nhìn một dòng là biết tuần này đã phủ tới đâu. */
  const summary = useMemo(() => {
    const list = cells ?? [];
    return {
      trainers: grid.length,
      shifts: list.length,
      booked: list.reduce((sum, c) => sum + c.bookedSessions, 0),
      onLeave: list.filter((c) => c.onLeave).length,
    };
  }, [cells, grid.length]);

  if (isLoading) return <LoadingSkeleton />;

  const weekLabel = `${dayMonth(from)} – ${dayMonth(to)}`;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-card">
        {/* Thanh điều hướng — cùng bố cục với CalendarBoard của màn đặt lịch. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label={tc("common.actions.previous")}
              onClick={() => setAnchor(addDays(anchor, -WEEK_DAYS))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-base font-bold tabular-nums">
              {weekLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={tc("common.actions.next")}
              onClick={() => setAnchor(addDays(anchor, WEEK_DAYS))}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAnchor(startOfWeek(today))}>
              {t("thisWeek")}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-sm border border-border bg-card" />
              {t("legendShift")}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-3 rounded-sm border border-warning/40 bg-warning-muted"
              />
              {t("legendLeave")}
            </span>
          </div>

          <Button onClick={() => setAssignOpen(true)}>
            <CalendarPlus className="mr-2 size-4" />
            {t("assign")}
          </Button>
        </div>

        {grid.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Users className="size-8 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium">{t("empty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyHint")}</p>
            </div>
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <CalendarPlus className="mr-2 size-4" />
              {t("assign")}
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-44 border-b border-r border-border bg-card px-3 py-2 text-left text-[11px] font-bold uppercase text-muted-foreground">
                      {t("trainer")}
                    </th>
                    {dates.map((date) => {
                      const weekend = isoWeekday(date) >= 6;
                      return (
                        <th
                          key={date}
                          className={cn(
                            "border-b border-r border-border px-2 py-1.5 text-center text-[11px] font-bold uppercase",
                            weekend ? "text-muted-foreground/70" : "text-muted-foreground",
                            date === today && "bg-primary/5",
                          )}
                        >
                          <span className="block">{tc(weekdayShortKey(isoWeekday(date)))}</span>
                          <span
                            className={cn(
                              "mt-0.5 inline-flex h-5 items-center justify-center rounded-full px-1.5 tabular-nums",
                              date === today && "bg-primary text-primary-foreground",
                            )}
                          >
                            {dayMonth(date)}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row) => (
                    <tr key={row.ptProfileId} className="group/row">
                      <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-2 align-top text-sm font-medium">
                        {row.name}
                      </td>
                      {dates.map((date) => {
                        const dayCells = row.byDate.get(date) ?? [];
                        const weekend = isoWeekday(date) >= 6;
                        return (
                          <td
                            key={date}
                            className={cn(
                              "min-w-28 border-b border-r border-border p-1 align-top",
                              weekend && "bg-muted/40",
                              date === today && "bg-primary/5",
                            )}
                          >
                            {dayCells.length === 0 ? (
                              <span className="sr-only">{t("noShift")}</span>
                            ) : (
                              <div className="space-y-1">
                                {dayCells.map((cell) => (
                                  <RosterCell
                                    key={cell.assignmentId}
                                    cell={cell}
                                    removing={unassign.isPending}
                                    removeLabel={t("remove")}
                                    leaveLabel={t("onLeave")}
                                    bookedLabel={t("booked", { count: cell.bookedSessions })}
                                    onRemove={() => unassign.mutate(cell)}
                                  />
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              {t("summary", {
                trainers: summary.trainers,
                shifts: summary.shifts,
                booked: summary.booked,
              })}
              {summary.onLeave > 0 ? ` · ${t("summaryLeave", { count: summary.onLeave })}` : ""}
            </p>
          </>
        )}
      </div>

      <AssignShiftDialog branchId={branchId} open={assignOpen} onOpenChange={setAssignOpen} />
    </section>
  );
}

interface RosterCellProps {
  cell: ShiftRosterCell;
  removing: boolean;
  removeLabel: string;
  leaveLabel: string;
  bookedLabel: string;
  onRemove: () => void;
}

/**
 * Một ca trong ô ngày.
 *
 * Nút gỡ chỉ hiện khi rê chuột vào đúng ô (và luôn hiện khi focus bàn phím):
 * lưới một tuần của mười PT là bảy chục dấu ✕ nằm sẵn — vừa rối vừa dễ bấm nhầm
 * vào thứ không hoàn tác được.
 */
function RosterCell({
  cell,
  removing,
  removeLabel,
  leaveLabel,
  bookedLabel,
  onRemove,
}: RosterCellProps) {
  return (
    <div
      className={cn(
        "group/cell relative rounded-md border px-1.5 py-1 text-xs transition-colors",
        cell.onLeave
          ? "border-warning/40 bg-warning-muted text-warning"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold tabular-nums">
          {cell.startTime.slice(0, 5)}–{cell.endTime.slice(0, 5)}
        </span>
        <button
          type="button"
          title={removeLabel}
          aria-label={removeLabel}
          disabled={removing}
          onClick={onRemove}
          className={cn(
            "rounded p-0.5 text-muted-foreground opacity-0 transition-opacity",
            "hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100",
            "group-hover/cell:opacity-100",
          )}
        >
          <X className="size-3" />
        </button>
      </div>

      <p className="truncate text-[11px] text-muted-foreground">{cell.shiftName}</p>

      {cell.onLeave ? (
        <p className="mt-0.5 text-[10px] font-semibold uppercase">{leaveLabel}</p>
      ) : cell.bookedSessions > 0 ? (
        <p className="mt-0.5 text-[10px] font-semibold uppercase text-primary">{bookedLabel}</p>
      ) : null}
    </div>
  );
}

/** "dd/MM" — tự ghép thay vì toLocaleDateString: dấu phân cách của vi-VN khác
 * nhau giữa các trình duyệt ("18/08" vs "18-08"), mà lịch thì cần ổn định. */
function dayMonth(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
