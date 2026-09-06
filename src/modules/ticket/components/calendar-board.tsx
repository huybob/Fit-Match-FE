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
  /**
   * Ngày có thuộc THÁNG đang xem hay không. Khác `inPeriod` ở chế độ tuần: một
   * tuần vắt qua hai tháng thì mọi ô đều `inPeriod` nhưng chỉ một phần `inMonth`.
   */
  inMonth: boolean;
  isToday: boolean;
  /**
   * Ô không bấm được (ngày đã qua, chi nhánh đã đóng cửa hôm nay, ngoài phạm vi
   * gói). Nằm trong ctx để `renderDay` khỏi đổ chip khung giờ lên một ngày
   * không chọn được — mời gọi một cú bấm không dẫn tới đâu.
   */
  disabled: boolean;
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

  const monthLabel = fromIsoDate(monthAnchor).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const periodLabel =
    view === "week" ? `${formatShort(days[0])} – ${formatShort(days[6])}` : monthLabel;

  /** Lưới đang chứa ngày của tháng khác -> mới cần chú giải hai loại ô. */
  const hasOtherMonth = days.some((day) => !isSameMonth(day, monthAnchor));

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border p-3">
        <div className="flex min-w-0 items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("common.actions.previous")}
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {/* Nhãn kỳ co được: `min-w-44` cứng đẩy cụm tuần/tháng xuống dòng ở
              màn hẹp, để lại một hàng công cụ gãy đôi giữa hai nút mũi tên. */}
          <span className="min-w-0 flex-1 truncate px-1 text-center text-sm font-bold capitalize sm:min-w-40 sm:text-base">
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

        {/* Chú giải hai loại ô: lưới tháng luôn vẽ đủ 6 hàng nên đầu và cuối
            lưới là ngày của tháng khác — không nói rõ thì rất dễ bấm vào 31/7
            khi đang xem tháng 8. */}
        {hasOtherMonth ? (
          <div className="order-last flex w-full items-center gap-3 text-[11px] font-medium text-muted-foreground lg:order-none lg:w-auto">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-sm border border-border bg-card" />
              {t("ticket.schedule.legendThisMonth")}
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-sm border border-border bg-muted" />
              {t("ticket.schedule.legendOtherMonth")}
            </span>
          </div>
        ) : null}

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

      {/*
        Bảy cột là bảy cột — ép chúng vào bề ngang điện thoại thì mỗi ô còn ~45px,
        chip "07:00 · Tên PT" bên trong bị băm nhỏ đến mức không đọc được (đúng
        cảnh ở ảnh chụp màn hẹp). Cho cả hàng thứ và lưới ngày cuộn NGANG cùng
        nhau dưới một bề rộng tối thiểu: thà kéo ngang còn hơn nhìn một lưới
        không đọc nổi. Trên desktop khung rộng hơn ngưỡng này nên không có gì đổi.
      */}
      <div className="overflow-x-auto">
      <div className="min-w-[42rem]">
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
          const inMonth = isSameMonth(date, monthAnchor);
          const disabled = isDayDisabled?.(date) ?? false;
          const ctx: CalendarDayContext = {
            date,
            inPeriod: view === "week" || inMonth,
            inMonth,
            isToday: date === today,
            disabled,
          };
          const parsed = fromIsoDate(date);

          return (
            <button
              key={date}
              type="button"
              disabled={disabled || !onDayClick}
              onClick={() => onDayClick?.(date)}
              className={cn(
                "flex flex-col gap-1 border-b border-r border-border p-1.5 text-left align-top",
                view === "week" ? "min-h-40" : "min-h-24",
                disabled && "cursor-not-allowed opacity-40",
                !disabled && onDayClick && "hover:bg-muted/50",
                dayClassName?.(ctx),
                // Nền "tháng khác" đặt SAU dayClassName: nơi gọi tô nền cho ngày
                // có buổi tập, nền đó thắng thì ngày của tháng trước/sau trông y
                // như ngày trong tháng — đúng chỗ dễ bấm nhầm nhất.
                !inMonth && "bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  // Ngày trong tháng: hình tròn như cũ. Ngày tháng khác: rộng ra
                  // để ghi kèm tháng ("31/7") — không ai phải đếm ngược từ đầu lưới.
                  inMonth ? "w-6" : "gap-px px-1.5 text-muted-foreground",
                  ctx.isToday && "bg-primary text-primary-foreground",
                )}
              >
                {parsed.getDate()}
                {inMonth ? null : (
                  <span className="text-[10px] font-bold">/{parsed.getMonth() + 1}</span>
                )}
              </span>
              {renderDay(ctx)}
            </button>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}

function formatShort(iso: string) {
  return fromIsoDate(iso).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}
