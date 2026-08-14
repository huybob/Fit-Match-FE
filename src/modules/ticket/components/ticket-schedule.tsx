"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, CalendarCheck, CalendarDays, UserRound, X } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn.util";
import { useMySessions, useMyTickets, usePtSlotGrid, useScheduleTicket } from "../hooks/use-ticket";
import { periodRange, plannedDays, todayIso } from "../calendar-date.util";
import { CalendarBoard, type CalendarView } from "./calendar-board";
import { DayComposer } from "./day-composer";
import type { PtGridSelection } from "./pt-availability-grid";
import type { ScheduleDayPt, Ticket, TrainingSession } from "@/types/Ticket";

/** Không có PT nào được lọc — hằng số riêng vì Select không nhận value rỗng. */
const NO_PT = "0";

/**
 * Đặt lịch cho vé đã kích hoạt, trên một bảng biểu lịch.
 *
 * - Vé DAY: chọn đúng một ngày (+ khung PT nếu vé có PT).
 * - Vé PACKAGE: chọn ngày bắt đầu, server sinh đủ dayCount ngày LIÊN TIẾP.
 *   PT gán cho từng ngày là TUỲ CHỌN — để trống thì bổ sung sau (câu 8).
 *
 * Lịch luôn hiện buổi đã xếp của MỌI vé, không riêng vé đang thao tác: chọn
 * trùng ngày là chuyện phải thấy trước khi bấm, không phải sau khi bấm.
 */
export function TicketSchedulePage() {
  const t = useTranslations("ticket.schedule");
  const params = useSearchParams();
  const { toast } = useToast();

  const preselected = Number(params.get("ticketId") ?? 0);
  const { data: page, isLoading } = useMyTickets({ status: "ACTIVE", size: 50 });

  const [ticketId, setTicketId] = useState(preselected);
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(todayIso());
  const [ptFilter, setPtFilter] = useState<string>(NO_PT);
  const [startDate, setStartDate] = useState("");
  const [dayPts, setDayPts] = useState<Record<number, PtGridSelection>>({});
  const [openDay, setOpenDay] = useState<string | null>(null);

  const schedule = useScheduleTicket();

  const tickets = (page?.content ?? []).filter(
    (item) => (item.scheduledDays ?? 0) < item.dayCount,
  );
  const ticket = tickets.find((item) => item.id === ticketId) ?? tickets[0];

  const { from, to } = periodRange(view, anchor);
  const { data: sessions } = useMySessions(from, to);

  // Một truy vấn cho cả chi nhánh: vừa dựng được danh sách PT có khung trong kỳ,
  // vừa lọc tại chỗ khi đổi PT mà không phải gọi lại server.
  const { data: cells, isLoading: cellsLoading } = usePtSlotGrid(
    ticket?.gymBranchId ?? 0,
    from,
    to,
    undefined,
    Boolean(ticket?.withPt),
  );

  const ptOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const cell of cells ?? []) {
      if (cell.ptProfileId) map.set(cell.ptProfileId, cell.ptName ?? `#${cell.ptProfileId}`);
    }
    return [...map].map(([id, name]) => ({ id, name }));
  }, [cells]);

  /** Khung rảnh theo ngày của PT đang lọc — nguồn cho chip trong ô lịch. */
  const slotsByDate = useMemo(() => {
    const map = new Map<string, { count: number; times: string[] }>();
    for (const cell of cells ?? []) {
      if (cell.taken) continue;
      const entry = map.get(cell.date) ?? { count: 0, times: [] };
      entry.count += 1;
      if (ptFilter !== NO_PT && cell.ptProfileId === Number(ptFilter)) {
        entry.times.push(cell.startTime.slice(0, 5));
      }
      map.set(cell.date, entry);
    }
    for (const entry of map.values()) entry.times.sort();
    return map;
  }, [cells, ptFilter]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, TrainingSession[]>();
    for (const session of sessions ?? []) {
      const list = map.get(session.sessionDate) ?? [];
      list.push(session);
      map.set(session.sessionDate, list);
    }
    return map;
  }, [sessions]);

  const days = useMemo(
    () => (ticket ? plannedDays(startDate, ticket.kind === "DAY" ? 1 : ticket.dayCount) : []),
    [ticket, startDate],
  );
  const dayIndexOf = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((day, index) => map.set(day, index + 1));
    return map;
  }, [days]);

  // Câu 29: cảnh báo trùng nhưng VẪN cho đặt.
  const clashes = useMemo(
    () => (sessions ?? []).filter((session) => days.includes(session.sessionDate)),
    [sessions, days],
  );

  if (isLoading) return <LoadingSkeleton />;
  if (!tickets.length || !ticket) {
    return <EmptyState title={t("noActiveTicket")} description={t("noActiveTicketHint")} />;
  }

  function resetSelection() {
    setStartDate("");
    setDayPts({});
    setOpenDay(null);
  }

  function handleDayClick(date: string) {
    if (!ticket) return;
    if (ticket.kind === "DAY") {
      setStartDate(date);
      if (ticket.withPt) setOpenDay(date);
      return;
    }
    // Vé gói: lần bấm đầu chốt ngày bắt đầu, các lần sau là gán PT cho ngày đó.
    if (!startDate) {
      setStartDate(date);
      return;
    }
    if (dayIndexOf.has(date)) setOpenDay(date);
  }

  async function submit() {
    if (!ticket || !startDate) return;
    try {
      const payload =
        ticket.kind === "DAY"
          ? {
              date: startDate,
              ptId: dayPts[1]?.ptProfileId ?? null,
              slotStart: dayPts[1]?.startTime ?? null,
            }
          : {
              startDate,
              days: Object.entries(dayPts).map<ScheduleDayPt>(([dayIndex, sel]) => ({
                dayIndex: Number(dayIndex),
                ptId: sel.ptProfileId,
                slotStart: sel.startTime,
              })),
            };
      await schedule.mutateAsync({ id: ticket.id, payload });
      toast({ type: "success", title: t("scheduled") });
      resetSelection();
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    }
  }

  const assignedCount = Object.keys(dayPts).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ticket.kind === "DAY" ? t("hintDay") : t("hintPackage", { days: ticket.dayCount })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <label className="text-sm font-medium">{t("pickTicket")}</label>
        <Select
          value={String(ticket.id)}
          onValueChange={(value) => {
            setTicketId(Number(value));
            resetSelection();
            setPtFilter(NO_PT);
          }}
        >
          <SelectTrigger className="h-9 w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tickets.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.ticketTypeName} · {item.gymBranchName} (
                {t("scheduledOf", { done: item.scheduledDays ?? 0, total: item.dayCount })})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {ticket.withPt ? (
          <>
            <label className="ml-2 flex items-center gap-1.5 text-sm font-medium">
              <UserRound className="size-4" /> {t("ptFilter")}
            </label>
            <Select value={ptFilter} onValueChange={setPtFilter}>
              <SelectTrigger className="h-9 w-56">
                <SelectValue placeholder={t("ptFilterNone")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PT}>{t("ptFilterNone")}</SelectItem>
                {ptOptions.map((pt) => (
                  <SelectItem key={pt.id} value={String(pt.id)}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : null}

        {startDate ? (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={resetSelection}>
            <X className="mr-1 size-3.5" />
            {t("clearSelection")}
          </Button>
        ) : null}
      </div>

      {clashes.length > 0 ? (
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{t("clashTitle")}</p>
            <ul className="mt-1 list-disc pl-4">
              {clashes.map((session) => (
                <li key={session.id}>
                  {session.sessionDate} — {t("clashItem", { ticket: session.ticketId })}
                </li>
              ))}
            </ul>
            <p className="mt-1">{t("clashHint")}</p>
          </div>
        </div>
      ) : null}

      <CalendarBoard
        view={view}
        onViewChange={setView}
        anchor={anchor}
        onAnchorChange={setAnchor}
        onDayClick={handleDayClick}
        isDayDisabled={(date) =>
          // Sau khi chốt ngày bắt đầu của gói, chỉ các ngày TRONG gói mới thao
          // tác được — bấm ra ngoài không có nghĩa gì và chỉ gây hiểu nhầm.
          ticket.kind === "PACKAGE" && Boolean(startDate) && !dayIndexOf.has(date)
        }
        dayClassName={({ date }) =>
          cn(
            dayIndexOf.has(date) && "bg-primary/5 ring-1 ring-inset ring-primary/40",
            date === startDate && "ring-2 ring-primary",
          )
        }
        renderDay={({ date }) => {
          const index = dayIndexOf.get(date);
          const slots = slotsByDate.get(date);
          const daySessions = sessionsByDate.get(date) ?? [];
          const chosen = index ? dayPts[index] : undefined;

          return (
            <div className="flex w-full flex-col gap-0.5 overflow-hidden">
              {index ? (
                <span className="text-[10px] font-bold text-primary">
                  {t("dayOfPackage", { index })}
                </span>
              ) : null}

              {daySessions.map((session) => (
                <span
                  key={session.id}
                  className="truncate rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground"
                >
                  {session.ptSlotStart ? session.ptSlotStart.slice(0, 5) : t("chipBooked")}
                </span>
              ))}

              {chosen ? (
                <span className="truncate rounded bg-primary px-1 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {chosen.startTime.slice(0, 5)} · {chosen.ptName}
                </span>
              ) : null}

              {ptFilter !== NO_PT && slots?.times.length ? (
                <>
                  {slots.times.slice(0, 3).map((time) => (
                    <span
                      key={time}
                      className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {time}
                    </span>
                  ))}
                  {slots.times.length > 3 ? (
                    <span className="text-[10px] text-muted-foreground">
                      +{slots.times.length - 3}
                    </span>
                  ) : null}
                </>
              ) : null}

              {/* Chưa lọc PT thì chỉ đếm — đổ hết chip của mọi PT vào ô tháng sẽ
                  thành một bãi không đọc được. */}
              {ptFilter === NO_PT && slots?.count ? (
                <span className="text-[10px] text-muted-foreground">
                  {t("slotCount", { count: slots.count })}
                </span>
              ) : null}
            </div>
          );
        }}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        {startDate ? (
          <>
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="size-3" />
              {ticket.kind === "DAY"
                ? startDate
                : t("packageRange", { from: days[0], to: days[days.length - 1] })}
            </Badge>
            {ticket.withPt ? (
              <span className="text-sm text-muted-foreground">
                {t("ptAssigned", { done: assignedCount, total: days.length })}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            {ticket.kind === "DAY" ? t("pickDate") : t("pickStartDate")}
          </span>
        )}

        <Button
          className="ml-auto"
          disabled={!startDate || schedule.isPending}
          onClick={submit}
        >
          <CalendarCheck className="mr-2 size-4" />
          {t("confirm")}
        </Button>
      </div>

      {openDay && ticket.withPt ? (
        <DayComposer
          branchId={ticket.gymBranchId}
          date={openDay}
          dayIndex={dayIndexOf.get(openDay) ?? 1}
          selected={dayPts[dayIndexOf.get(openDay) ?? 1] ?? null}
          onSelect={(sel) =>
            setDayPts((prev) => ({ ...prev, [dayIndexOf.get(openDay) ?? 1]: sel }))
          }
          onClear={() =>
            setDayPts((prev) => {
              const next = { ...prev };
              delete next[dayIndexOf.get(openDay) ?? 1];
              return next;
            })
          }
          onClose={() => setOpenDay(null)}
          loadingCells={cellsLoading}
        />
      ) : null}
    </div>
  );
}

export type { Ticket };
