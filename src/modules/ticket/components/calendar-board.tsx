"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { WEEKDAY_ORDER, weekdayShortKey } from "@/shared/utils/enum-label.util";
import {
  addDays,
  addMonths,
  fromIsoDate,
  isSameMonth,
  periodDays,
  startOfMonth,
  todayIso,
} from "../calendar-date.util";

export type CalendarView = "month" | "week";

export interface CalendarDayContext {
  date: string;
  /** false = ô tràn từ tháng trước/sau (chỉ có ở chế độ tháng). */
  inPeriod: boolean;
  isToday: boolean;
}

interface CalendarBoardProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  /** Một ngày bất kỳ nằm trong khoảng đang xem. */
  anchor: string;
  onAnchorChange: (anchor: string) => void;
  /** Nội dung bên trong ô ngày — chip khung giờ, buổi đã xếp… */
  renderDay: (ctx: CalendarDayContext) => ReactNode;
  onDayClick?: (date: string) => void;
  /** Lớp CSS thêm cho ô (highlight ngày của gói, ngày đang chọn…). */
  dayClassName?: (ctx: CalendarDayContext) => string | undefined;
  /** Ngày không bấm được — vd ngoài phạm vi gói đã chọn. */
  isDayDisabled?: (date: string) => boolean;
}

/**
 * Lịch tháng/tuần — TRÌNH BÀY THUẦN, không gọi API và không biết gì về vé.
 *
 * Ô ngày do bên gọi vẽ qua `renderDay`. Tách như vậy vì cùng một lịch phải phục
 * vụ ba thứ khác nhau (buổi đã xếp, khung rảnh của PT đang chọn, highlight ngày
 * của gói) và trộn chúng vào đây sẽ khoá component vào đúng một màn hình.
 */
export function CalendarBoard({
  view,
  onViewChange,
  anchor,
  onAnchorChange,
  renderDay,
  onDayClick,
  dayClassName,
  isDayDisabled,
}: CalendarBoardProps) {
  const t = useTranslations();
  const days = periodDays(view, anchor);
  const today = todayIso();
  const monthAnchor = startOfMonth(anchor);

  function shift(direction: 1 | -1) {
    onAnchorChange(
      view === "week" ? addDays(anchor, 7 * direction) : addMonths(anchor, direction),
    );
  }

  const periodLabel =
    view === "week"
      ? `${formatShort(days[0])} – ${formatShort(days[6])}`
      : fromIsoDate(monthAnchor).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("common.actions.previous")}
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-semibold capitalize">
            {periodLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("common.actions.next")}
            onClick={() => shift(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAnchorChange(today)}>
            {t("ticket.schedule.today")}
          </Button>
        </div>

        <div className="flex rounded-md border border-border p-0.5">
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onViewChange(option)}
              className={cn(
                "rounded px-3 py-1 text-xs font-semibold transition-colors",
                view === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(option === "week" ? "ticket.schedule.viewWeek" : "ticket.schedule.viewMonth")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_ORDER.map((day) => (
          <div
            key={day}
            className="px-2 py-1.5 text-center text-[11px] font-bold uppercase text-muted-foreground"
          >
            {t(weekdayShortKey(day))}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const ctx: CalendarDayContext = {
            date,
            inPeriod: view === "week" || isSameMonth(date, monthAnchor),
            isToday: date === today,
          };
          const disabled = isDayDisabled?.(date) ?? false;

          return (
            <button
              key={date}
              type="button"
              disabled={disabled || !onDayClick}
              onClick={() => onDayClick?.(date)}
              className={cn(
                "flex flex-col gap-1 border-b border-r border-border p-1.5 text-left align-top",
                view === "week" ? "min-h-40" : "min-h-24",
                !ctx.inPeriod && "bg-muted/30",
                disabled && "cursor-not-allowed opacity-40",
                !disabled && onDayClick && "hover:bg-muted/50",
                dayClassName?.(ctx),
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  ctx.isToday && "bg-primary text-primary-foreground",
                  !ctx.inPeriod && "text-muted-foreground",
                )}
              >
                {fromIsoDate(date).getDate()}
              </span>
              {renderDay(ctx)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatShort(iso: string) {
  return fromIsoDate(iso).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}
