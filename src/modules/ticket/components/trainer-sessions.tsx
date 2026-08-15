"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, UserRound } from "lucide-react";
import { ticketService } from "@/services/ticket.service";
import { useFormatters } from "@/i18n/use-formatters";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { addDays, fromIsoDate, startOfWeek, todayIso } from "../calendar-date.util";
import { sessionKeys } from "../query-keys";
import type { TrainingSession } from "@/types/Ticket";

/** Số ngày một trang lịch — trọn một tuần, khớp cách PT khai lịch rảnh. */
const WEEK_DAYS = 7;

/**
 * "Buổi tập" của PT — lịch dạy đọc từ `/pt/sessions`.
 *
 * Trước đây mục này trong sidebar trỏ tới một route không tồn tại nên chỉ ra
 * 404. PT là bên duy nhất KHÔNG có màn xem mình dạy ai, ngày nào: khách có
 * /schedule, gym có /gym/calendar.
 *
 * Đi theo TUẦN chứ không phải tháng: PT cần biết hôm nay và vài ngày tới dạy ai
 * lúc mấy giờ, còn nhìn cả tháng thì mỗi ô chỉ còn chỗ cho một con số.
 */
export function TrainerSessionsPage() {
  const t = useTranslations("trainer.sessions");
  const tStatus = useTranslations("common.sessionStatus");
  const fmt = useFormatters();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayIso()));
  const weekEnd = addDays(weekStart, WEEK_DAYS - 1);
  const today = todayIso();

  const { data: sessions, isLoading } = useQuery({
    queryKey: sessionKeys.pt(weekStart, weekEnd),
    queryFn: () => ticketService.ptSessions(weekStart, weekEnd),
  });

  /** Gộp theo ngày để mỗi ngày là một khối, kể cả ngày trống. */
  const days = useMemo(() => {
    const byDate = new Map<string, TrainingSession[]>();
    for (const session of sessions ?? []) {
      const list = byDate.get(session.sessionDate) ?? [];
      list.push(session);
      byDate.set(session.sessionDate, list);
    }
    return Array.from({ length: WEEK_DAYS }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, sessions: byDate.get(date) ?? [] };
    });
  }, [sessions, weekStart]);

  const total = sessions?.length ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -WEEK_DAYS))}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(today))}>
          {t("thisWeek")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, WEEK_DAYS))}>
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-1 text-sm font-semibold">
          {fmt.date(fromIsoDate(weekStart))} – {fmt.date(fromIsoDate(weekEnd))}
        </span>
        <Badge variant="outline" className="ml-auto gap-1">
          <CalendarDays className="size-3" />
          {t("countInWeek", { count: total })}
        </Badge>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !total ? (
        <EmptyState title={t("empty")} description={t("emptyHint")} />
      ) : (
        <ul className="space-y-3">
          {days.map(({ date, sessions: ofDay }) => (
            <li
              key={date}
              className={cn(
                "rounded-2xl border border-border bg-card p-4",
                date === today && "border-primary/50 bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {fmt.date(fromIsoDate(date))}
                  {date === today ? ` · ${t("today")}` : ""}
                </p>
                <span className="text-xs text-muted-foreground">
                  {t("countInDay", { count: ofDay.length })}
                </span>
              </div>

              {!ofDay.length ? (
                <p className="mt-2 text-sm text-muted-foreground">{t("freeDay")}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {ofDay.map((session) => (
                    <li
                      key={session.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/40 p-3 text-sm"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Clock className="size-3.5 text-primary" />
                        {session.ptSlotStart
                          ? `${session.ptSlotStart.slice(0, 5)}${
                              session.ptSlotEnd ? `–${session.ptSlotEnd.slice(0, 5)}` : ""
                            }`
                          : t("noSlot")}
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{session.customerName ?? t("unknownCustomer")}</span>
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {tStatus(session.status)}
                      </Badge>
                      {session.checkedInAt ? (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="size-3.5" />
                          {t("checkedIn")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
