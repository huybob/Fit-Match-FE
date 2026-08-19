"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarOff, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { shiftService } from "@/services/shift.service";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { addDays, isoWeekday, startOfWeek, todayIso } from "@/modules/ticket/calendar-date.util";
import { weekdayShortKey } from "@/shared/utils/enum-label.util";
import { trainerKeys } from "../query-keys";
import { LeaveRequestDialog } from "./leave-request-dialog";
import { LeaveRequestList } from "./leave-request-list";
import type { PtShift } from "@/types/Shift";

const WEEKS = 4;
const WEEK_DAYS = 7;

/**
 * "Lịch ca của tôi" — thay màn PT tự khai lịch của mô hình cũ.
 *
 * BE V85 đảo chủ thể sở hữu lịch: Gym xếp ca, PT chỉ ĐỌC. Màn này cố ý không có
 * một nút sửa nào; thứ duy nhất PT chủ động được là gửi đơn xin nghỉ, và đơn đó
 * phải được Gym duyệt mới có hiệu lực.
 *
 * Bố cục theo TUẦN chứ không phải 28 thẻ bằng nhau: PT quan tâm "tuần này làm
 * mấy buổi", còn ngày nghỉ chỉ cần là một ô mờ — cho chúng cùng kích thước với
 * ngày có ca thì cả lưới đọc như nhiễu.
 */
export function TrainerShiftSchedulePage() {
  const t = useTranslations("ptShifts");
  const tc = useTranslations();
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Dùng calendar-date.util chứ không tự tính bằng toISOString(): nửa đêm GIỜ
  // MÁY đổi sang ISO (UTC) ở UTC+7 sẽ lùi một ngày, và lịch ca hiện sai ngày đầu.
  const today = todayIso();
  const from = useMemo(() => startOfWeek(today), [today]);
  const to = useMemo(() => addDays(from, WEEKS * WEEK_DAYS - 1), [from]);

  const { data: shifts, isLoading } = useQuery({
    queryKey: trainerKeys.shifts(from, to),
    queryFn: () => shiftService.myShifts(from, to),
  });

  const byDate = useMemo(() => {
    const map = new Map<string, PtShift[]>();
    for (const shift of shifts ?? []) {
      const list = map.get(shift.date) ?? [];
      list.push(shift);
      map.set(shift.date, list);
    }
    return map;
  }, [shifts]);

  const weeks = useMemo(
    () =>
      Array.from({ length: WEEKS }, (_, w) => {
        const weekStart = addDays(from, w * WEEK_DAYS);
        return {
          start: weekStart,
          end: addDays(weekStart, WEEK_DAYS - 1),
          days: Array.from({ length: WEEK_DAYS }, (_, d) => addDays(weekStart, d)),
        };
      }),
    [from],
  );

  if (isLoading) return <LoadingSkeleton />;

  const total = shifts?.length ?? 0;
  const booked = (shifts ?? []).reduce((sum, s) => sum + s.bookedSessions, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("summary", { shifts: total, booked })}
          </p>
        </div>
        <Button onClick={() => setLeaveOpen(true)}>
          <CalendarOff className="mr-2 size-4" />
          {t("requestLeave")}
        </Button>
      </div>

      <div className="flex gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>{t("readOnlyNotice")}</p>
      </div>

      <div className="space-y-4">
        {weeks.map((week) => {
          const weekShifts = week.days.reduce(
            (sum, date) => sum + (byDate.get(date)?.length ?? 0),
            0,
          );
          return (
            <div key={week.start} className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <span className="text-sm font-semibold tabular-nums">
                  {dayMonth(week.start)} – {dayMonth(week.end)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {weekShifts === 0 ? t("weekOff") : t("weekCount", { count: weekShifts })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
                {week.days.map((date) => {
                  const dayShifts = byDate.get(date) ?? [];
                  const isToday = date === today;
                  return (
                    <div
                      key={date}
                      className={cn(
                        "min-h-24 border-b border-r border-border p-2",
                        dayShifts.length === 0 && "bg-muted/40",
                        isToday && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground">
                        <span>{tc(weekdayShortKey(isoWeekday(date)))}</span>
                        <span
                          className={cn(
                            "inline-flex h-5 items-center justify-center rounded-full px-1.5 tabular-nums",
                            isToday && "bg-primary text-primary-foreground",
                          )}
                        >
                          {dayMonth(date)}
                        </span>
                      </div>

                      {dayShifts.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground/70">{t("noShift")}</p>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {dayShifts.map((shift) => (
                            <div
                              key={`${date}-${shift.shiftId}`}
                              className={cn(
                                "rounded-md border px-1.5 py-1 text-xs",
                                shift.onLeave
                                  ? "border-warning/40 bg-warning-muted text-warning"
                                  : "border-border bg-card",
                              )}
                            >
                              <p className="font-semibold tabular-nums">
                                {shift.startTime.slice(0, 5)}–{shift.endTime.slice(0, 5)}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {shift.shiftName}
                              </p>
                              {shift.onLeave ? (
                                <p className="mt-0.5 text-[10px] font-semibold uppercase">
                                  {t("onLeave")}
                                </p>
                              ) : shift.bookedSessions > 0 ? (
                                <p className="mt-0.5 text-[10px] font-semibold uppercase text-primary">
                                  {t("booked", { count: shift.bookedSessions })}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <LeaveRequestList />

      <LeaveRequestDialog open={leaveOpen} onOpenChange={setLeaveOpen} />
    </div>
  );
}

/** "dd/MM" — tự ghép thay vì toLocaleDateString: dấu phân cách của vi-VN khác
 * nhau giữa các trình duyệt ("18/08" vs "18-08"), mà lịch thì cần ổn định. */
function dayMonth(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
