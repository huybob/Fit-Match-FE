"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/i18n/use-date-locale";
import { useFormatters } from "@/i18n/use-formatters";
import type { Booking } from "@/services/booking.service";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn.util";
import { itemName, statusVariant } from "../booking-status";

type View = "week" | "month";

/** Màu chấm theo trạng thái — bám đúng variant của Badge để hai nơi không lệch màu. */
const DOT: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  default: "bg-primary",
  secondary: "bg-muted-foreground",
};

/**
 * Bảng thời gian biểu các buổi tập theo TUẦN hoặc THÁNG.
 *
 * Danh sách lịch đặt phân trang 10 mục/trang nên không nhìn ra được "tuần này
 * mình tập hôm nào" — bảng này cho cái nhìn trực quan theo lịch, bấm vào một
 * buổi thì mở đúng dialog chi tiết đã có (không dựng luồng xem chi tiết thứ hai).
 *
 * Dữ liệu do trang cha truyền vào (đã fetch sẵn cho cả kỳ), component này thuần
 * trình bày.
 */
export function BookingTimetable({
  bookings,
  loading,
  onSelect,
}: {
  bookings: Booking[];
  loading?: boolean;
  onSelect: (booking: Booking) => void;
}) {
  const t = useTranslations();
  const fmt = useFormatters();
  const locale = useDateLocale();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());

  // weekStartsOn: 1 = thứ Hai, đúng quy ước lịch VN và khớp dayOfWeek của BE.
  const range = useMemo(() => {
    const start = view === "week" ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
    const end = view === "week" ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [anchor, view]);

  /** Gom booking theo ngày một lần, tránh lọc lại mảng trong từng ô lịch. */
  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!b.startAt) continue;
      const key = format(new Date(b.startAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""));
    }
    return map;
  }, [bookings]);

  const visibleCount = range.days.reduce(
    (sum, day) => sum + (byDay.get(format(day, "yyyy-MM-dd"))?.length ?? 0),
    0,
  );

  const title =
    view === "week"
      ? `${fmt.date(range.start)} – ${fmt.date(range.end)}`
      : format(anchor, "LLLL yyyy", { locale });

  const step = (dir: -1 | 1) =>
    setAnchor((prev) => (view === "week" ? addWeeks(prev, dir) : addMonths(prev, dir)));

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/80 p-4 shadow-sm sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
              {t("booking.timetable.title")}
            </h2>
            <p className="truncate text-xs text-muted-foreground first-letter:uppercase">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Không dùng ToggleGroup: design system chưa có component đó. Hai nút
              với aria-pressed cho cùng ngữ nghĩa mà không thêm primitive mới. */}
          <div className="flex items-center gap-1" role="group" aria-label={t("booking.timetable.viewLabel")}>
            {(["week", "month"] as const).map((v) => (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={view === v ? "default" : "outline"}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {t(`booking.timetable.${v}`)}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label={t("booking.timetable.prev")}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
              {t("booking.timetable.today")}
            </Button>
            <Button variant="outline" size="icon" onClick={() => step(1)} aria-label={t("booking.timetable.next")}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-7" aria-busy="true" aria-live="polite">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : visibleCount === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={CalendarDays}
            title={t("booking.timetable.emptyTitle")}
            description={t("booking.timetable.emptyBody")}
          />
        </div>
      ) : view === "week" ? (
        <WeekGrid days={range.days} byDay={byDay} onSelect={onSelect} />
      ) : (
        <MonthGrid days={range.days} anchor={anchor} byDay={byDay} onSelect={onSelect} />
      )}
    </section>
  );
}

/** Nhãn thứ theo ngôn ngữ đang chọn, tuần bắt đầu từ thứ Hai. */
function useWeekdayLabels() {
  const locale = useDateLocale();
  return useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: base, end: endOfWeek(base, { weekStartsOn: 1 }) }).map((d) =>
      format(d, "EEEEEE", { locale }),
    );
  }, [locale]);
}

function SessionPill({
  booking,
  onSelect,
  compact,
}: {
  booking: Booking;
  onSelect: (booking: Booking) => void;
  compact?: boolean;
}) {
  const t = useTranslations();
  const fmt = useFormatters();
  // variant của Badge là optional nên có thể là undefined — chốt về "default".
  const tone = DOT[statusVariant(booking.status) ?? "default"] ?? DOT.default;
  const name = itemName(booking, t("booking.unnamedService"));

  return (
    <button
      type="button"
      onClick={() => onSelect(booking)}
      title={`${fmt.time(booking.startAt)} · ${name}`}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-lg border border-border bg-background/60 px-1.5 py-1 text-left transition hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "text-[10px]" : "text-xs",
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", tone)} aria-hidden />
      <span className="shrink-0 font-bold tabular-nums text-foreground">{fmt.time(booking.startAt)}</span>
      <span className="truncate text-muted-foreground">{name}</span>
    </button>
  );
}

function WeekGrid({
  days,
  byDay,
  onSelect,
}: {
  days: Date[];
  byDay: Map<string, Booking[]>;
  onSelect: (booking: Booking) => void;
}) {
  const t = useTranslations();
  const locale = useDateLocale();

  // 1 cột trên điện thoại (7 cột ở 375px thì mỗi ô ~45px, không đọc được),
  // 7 cột từ lg trở lên.
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const items = byDay.get(format(day, "yyyy-MM-dd")) ?? [];
        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex min-h-24 flex-col gap-1.5 rounded-xl border p-2",
              isToday(day) ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
          >
            <p className="flex items-baseline justify-between gap-1">
              <span className="text-[11px] font-black uppercase text-muted-foreground first-letter:uppercase">
                {format(day, "EEE", { locale })}
              </span>
              <span className={cn("text-sm font-black tabular-nums", isToday(day) ? "text-primary" : "text-foreground")}>
                {format(day, "d")}
              </span>
            </p>
            {items.length ? (
              items.map((b) => <SessionPill key={b.id} booking={b} onSelect={onSelect} />)
            ) : (
              <span className="mt-1 text-[11px] text-muted-foreground">{t("booking.timetable.noSession")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({
  days,
  anchor,
  byDay,
  onSelect,
}: {
  days: Date[];
  anchor: Date;
  byDay: Map<string, Booking[]>;
  onSelect: (booking: Booking) => void;
}) {
  const t = useTranslations();
  const weekdays = useWeekdayLabels();

  // Lịch tháng giữ 7 cột ở mọi bề rộng (bóp thành 1 cột thì không còn là lịch);
  // cho cuộn ngang trong khung riêng để trang không bao giờ tràn.
  return (
    <div className="mt-4 -mx-1 overflow-x-auto px-1">
      <div className="min-w-[34rem]">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((label) => (
            <p key={label} className="pb-1 text-center text-[11px] font-black uppercase text-muted-foreground">
              {label}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const items = byDay.get(format(day, "yyyy-MM-dd")) ?? [];
            const outside = !isSameMonth(day, anchor);
            const shown = items.slice(0, 2);
            const rest = items.length - shown.length;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex min-h-20 flex-col gap-1 rounded-lg border p-1.5",
                  isToday(day)
                    ? "border-primary bg-primary/5"
                    : outside
                      ? "border-border/60 bg-muted/30"
                      : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "text-right text-xs font-black tabular-nums",
                    isToday(day) ? "text-primary" : outside ? "text-muted-foreground/60" : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                {shown.map((b) => (
                  <SessionPill key={b.id} booking={b} onSelect={onSelect} compact />
                ))}
                {rest > 0 && (
                  <span className="px-1 text-[10px] font-bold text-muted-foreground">
                    {t("booking.timetable.more", { count: rest })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
