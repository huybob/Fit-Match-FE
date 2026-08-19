"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Ticket as TicketIcon,
  UserRound,
  X,
} from "lucide-react";
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
import {
  useBranchBookingWindow,
  useMySessions,
  useMyTickets,
  usePtSlotGrid,
  useScheduleTicket,
} from "../hooks/use-ticket";
import { periodRange, plannedDays, todayIso } from "../calendar-date.util";
import { CalendarBoard, type CalendarDayContext, type CalendarView } from "./calendar-board";
import { DayComposer } from "./day-composer";
import { PtCancellationBanner } from "./pt-cancellation-banner";
import {
  SessionDetailDialog,
  SessionHoverCard,
  type BookedSession,
} from "./booked-session-info";
import type { PtGridSelection } from "./pt-availability-grid";
import type { ScheduleDayPt, Ticket } from "@/types/Ticket";

/** Không có PT nào được lọc — hằng số riêng vì Select không nhận value rỗng. */
const NO_PT = "0";

/** Không lọc vé nào — cùng lý do với {@link NO_PT}. */
const ALL_TICKETS = "0";

/**
 * Hai chế độ trên cùng một bảng lịch:
 *
 * - `view`  — mặc định: XEM những buổi đã đặt. Đưa chuột vào một ngày là thấy
 *   ngay gói nào / phòng gym nào; bấm (hoặc bấm "Xem chi tiết") mở hộp thoại
 *   đầy đủ. Không có gì bị chọn nhầm vì không có gì để chọn.
 * - `book`  — chọn ngày cho một vé cụ thể. Vào bằng nút "Đặt lịch", ra bằng nút
 *   "Hủy". Tách hẳn khỏi `view` vì hai chế độ dùng cùng một ô lịch cho hai việc
 *   khác nhau: trước đây bấm để xem thông tin và bấm để chốt ngày là CÙNG một
 *   cú bấm, khách không biết mình đang làm gì.
 */
type Mode = "view" | "book";

/**
 * Lịch tập của khách + đặt lịch cho vé đã kích hoạt.
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
  // Nút "Đặt lịch" ở /profile/tickets và bước cuối của luồng mua vé gắn thêm
  // `mode=book`: bấm đúng nút đó là muốn xếp ngày ngay, chứ không phải xem lại
  // lịch cũ. Mọi đường vào khác (menu, gõ URL) đều mở ở chế độ xem.
  const [mode, setMode] = useState<Mode>(params.get("mode") === "book" ? "book" : "view");

  // KHÔNG lọc theo status: buổi tập của vé đã dùng hết / hết hạn vẫn phải hiện
  // đủ tên gói và phòng gym khi xem lịch, và `/sessions/my` chỉ trả về ticketId.
  const { data: page, isLoading } = useMyTickets({ size: 100 });

  const [ticketId, setTicketId] = useState(preselected);
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(todayIso());
  const [ptFilter, setPtFilter] = useState<string>(NO_PT);
  /*
   * `?ticketId=` cũng là mặc định của bộ lọc chứ không chỉ của chế độ đặt: nút
   * "Xem lịch" ở màn Vé của tôi trỏ tới đúng một vé, mở ra lịch của MỌI vé là
   * trả lời một câu hỏi khác với câu khách vừa hỏi.
   */
  const [ticketFilter, setTicketFilter] = useState<string>(
    preselected ? String(preselected) : ALL_TICKETS,
  );
  const [startDate, setStartDate] = useState("");
  const [dayPts, setDayPts] = useState<Record<number, PtGridSelection>>({});
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);

  const schedule = useScheduleTicket();

  const tickets = useMemo(() => page?.content ?? [], [page]);
  const ticketById = useMemo(
    () => new Map(tickets.map((item) => [item.id, item])),
    [tickets],
  );
  /** Vé còn ngày chưa xếp — chỉ những vé này mới vào được chế độ đặt lịch. */
  const schedulable = useMemo(
    () =>
      tickets.filter(
        (item) => item.status === "ACTIVE" && (item.scheduledDays ?? 0) < item.dayCount,
      ),
    [tickets],
  );

  const ticket = schedulable.find((item) => item.id === ticketId) ?? schedulable[0];
  /**
   * Vé đang xếp lịch — chỉ có giá trị khi ở chế độ `book` VÀ thật sự còn vé xếp
   * được. Giữ ở dạng "vé hoặc undefined" thay vì một cờ boolean riêng để TypeScript
   * tự thu hẹp kiểu trong nhánh JSX, không phải rải `!` khắp nơi.
   */
  const bookingTicket = mode === "book" ? ticket : undefined;
  const booking = bookingTicket !== undefined;

  const { from, to } = periodRange(view, anchor);
  const { data: sessions } = useMySessions(from, to);

  // Một truy vấn cho cả chi nhánh: vừa dựng được danh sách PT có khung trong kỳ,
  // vừa lọc tại chỗ khi đổi PT mà không phải gọi lại server. Chế độ xem không
  // cần khung rảnh nên cũng không gọi.
  const { data: cells, isLoading: cellsLoading } = usePtSlotGrid(
    ticket?.gymBranchId ?? 0,
    from,
    to,
    undefined,
    booking && Boolean(ticket?.withPt),
  );

  /*
   * Chi nhánh đã đóng cửa thì hôm nay không còn đặt được nữa (luật ở
   * SessionSchedulingValidator). Mờ ô ngay trên lịch thay vì để khách chọn xong
   * mới nhận lỗi từ server.
   */
  const { bookableToday, closeTime } = useBranchBookingWindow(
    ticket?.gymProfileId,
    ticket?.gymBranchId,
  );
  const today = todayIso();

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

  /** Vé đã có buổi để xem — nguồn của bộ lọc vé ở chế độ xem. */
  const filterableTickets = useMemo(
    () => tickets.filter((item) => (item.scheduledDays ?? 0) > 0),
    [tickets],
  );
  /*
   * Vé đang lọc phải nằm trong danh sách chọn được, nếu không Select rơi vào
   * trạng thái "có value nhưng không có option": ô hiện rỗng còn lịch thì trống
   * trơn, không dấu hiệu nào cho biết vì sao. Xảy ra với `?ticketId=` trỏ tới vé
   * chưa xếp buổi nào, và với vé vừa bị huỷ hết buổi.
   */
  const activeTicketFilter = filterableTickets.some((item) => String(item.id) === ticketFilter)
    ? ticketFilter
    : ALL_TICKETS;

  /** Buổi đã đặt trong kỳ, ghép sẵn vé để thẻ hover có tên gói / phòng gym. */
  const entriesByDate = useMemo(() => {
    const map = new Map<string, BookedSession[]>();
    for (const session of sessions ?? []) {
      // Lọc CHỈ ở chế độ xem. Ở chế độ đặt, lịch phải hiện buổi của mọi vé —
      // đó là cách khách thấy trùng ngày TRƯỚC khi bấm; ẩn bớt đi thì bộ lọc
      // lại trở thành nguyên nhân gây ra chính cái va chạm nó che mất.
      if (!booking && activeTicketFilter !== ALL_TICKETS
          && String(session.ticketId) !== activeTicketFilter) {
        continue;
      }
      const list = map.get(session.sessionDate) ?? [];
      list.push({ session, ticket: ticketById.get(session.ticketId) });
      map.set(session.sessionDate, list);
    }
    // Buổi có khung giờ lên trước theo giờ; buổi tự tập (không khung) xuống cuối.
    for (const list of map.values()) {
      list.sort((a, b) =>
        (a.session.ptSlotStart ?? "99:99").localeCompare(b.session.ptSlotStart ?? "99:99"),
      );
    }
    return map;
  }, [sessions, ticketById, booking, activeTicketFilter]);

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
  if (!tickets.length) {
    return <EmptyState title={t("noActiveTicket")} description={t("noActiveTicketHint")} />;
  }

  function resetSelection() {
    setStartDate("");
    setDayPts({});
    setOpenDay(null);
  }

  function enterBooking() {
    if (!schedulable.length) return;
    resetSelection();
    setMode("book");
  }

  function exitBooking() {
    resetSelection();
    setPtFilter(NO_PT);
    setMode("view");
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

  /** Chế độ xem: bấm vào ngày có buổi = mở chi tiết; ngày trống thì không làm gì. */
  function handleViewDayClick(date: string) {
    if (entriesByDate.has(date)) setDetailDate(date);
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
      // Đặt xong là vé hết ngày để xếp -> trả về chế độ xem để khách thấy ngay
      // kết quả vừa đặt thay vì đứng lại trong một form không còn việc gì làm.
      exitBooking();
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    }
  }

  const assignedCount = Object.keys(dayPts).length;
  // Đếm theo những gì đang HIỆN trên lịch: lọc còn 3 buổi mà huy hiệu vẫn báo
  // 12 thì con số đó chỉ làm người xem nghi ngờ bộ lọc.
  const bookedCount = [...entriesByDate.values()].reduce((total, list) => total + list.length, 0);

  function renderDay({ date }: CalendarDayContext) {
    const index = booking ? dayIndexOf.get(date) : undefined;
    const slots = slotsByDate.get(date);
    const entries = entriesByDate.get(date) ?? [];
    const chosen = index ? dayPts[index] : undefined;

    const content = (
      <>
        {index ? (
          <span className="text-[10px] font-bold text-primary">
            {t("dayOfPackage", { index })}
          </span>
        ) : null}

        {entries.map(({ session, ticket: sessionTicket }) => (
          <span
            key={session.id}
            className="truncate rounded bg-primary/15 px-1 py-0.5 text-[10px] font-semibold text-primary"
            title={
              [sessionTicket?.ticketTypeName, sessionTicket?.gymBranchName, session.ptName]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          >
            {session.ptSlotStart
              ? `${session.ptSlotStart.slice(0, 5)}${session.ptName ? ` · ${session.ptName}` : ""}`
              : t("chipBooked")}
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
      </>
    );

    // Thẻ hover CHỈ ở chế độ xem: đang chọn ngày mà popover bật lên theo chuột sẽ
    // che mất mấy ô bên cạnh và chặn đúng cú bấm khách đang nhắm tới.
    if (!booking && entries.length > 0) {
      return (
        <SessionHoverCard date={date} entries={entries} onDetail={() => setDetailDate(date)}>
          {content}
        </SessionHoverCard>
      );
    }

    return <div className="flex w-full flex-col gap-0.5 overflow-hidden">{content}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {bookingTicket ? t("title") : t("viewTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bookingTicket
              ? bookingTicket.kind === "DAY"
                ? t("hintDay")
                : t("hintPackage", { days: bookingTicket.dayCount })
              : t("viewHint")}
          </p>
        </div>
      </div>

      {/*
        BE §4.1: buổi bị PT xin nghỉ vẫn nằm trên lịch (vé dùng được cả ngày),
        nên phải nói rõ ở đầu trang thay vì để khách tự phát hiện ô mất tên HLV.
      */}
      <PtCancellationBanner
        sessionIds={(sessions ?? []).map((session) => session.id)}
        onPickReplacement={(sessionId) => {
          const target = (sessions ?? []).find((session) => session.id === sessionId);
          if (target) setDetailDate(target.sessionDate);
        }}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        {bookingTicket ? (
          <>
            <label className="text-sm font-medium">{t("pickTicket")}</label>
            <Select
              value={String(bookingTicket.id)}
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
                {schedulable.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.ticketTypeName} · {item.gymBranchName} (
                    {t("scheduledOf", { done: item.scheduledDays ?? 0, total: item.dayCount })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {bookingTicket.withPt ? (
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

            <Button
              variant="outline"
              size="sm"
              className={cn(!startDate && "ml-auto")}
              onClick={exitBooking}
              disabled={schedule.isPending}
            >
              {t("cancelBooking")}
            </Button>

            {/* Ô "hôm nay" bị mờ cần một lời giải thích: không có nó, khách chỉ
                thấy một ngày không bấm được mà không hiểu vì sao. */}
            {!bookableToday ? (
              <p className="w-full text-xs text-muted-foreground">
                {closeTime ? t("closedTodayAt", { time: closeTime }) : t("closedToday")}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="size-3" />
              {t("bookedInPeriod", { count: bookedCount })}
            </Badge>

            {/* Một vé thì không có gì để lọc — ô chọn chỉ đứng đó gây nhiễu. */}
            {filterableTickets.length > 1 ? (
              <>
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <TicketIcon className="size-4" /> {t("ticketFilter")}
                </label>
                <Select value={activeTicketFilter} onValueChange={setTicketFilter}>
                  <SelectTrigger className="h-9 w-64">
                    <SelectValue placeholder={t("ticketFilterAll")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TICKETS}>{t("ticketFilterAll")}</SelectItem>
                    {filterableTickets.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.ticketTypeName} · {item.gymBranchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : null}

            <span className="text-sm text-muted-foreground">
              {schedulable.length
                ? t("schedulableTickets", { count: schedulable.length })
                : t("noSchedulable")}
            </span>
            <Button className="ml-auto" onClick={enterBooking} disabled={!schedulable.length}>
              <CalendarPlus className="mr-2 size-4" />
              {t("enterBooking")}
            </Button>
          </>
        )}
      </div>

      {booking && clashes.length > 0 ? (
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
        // Chế độ xem vẫn phải bấm được: ô bị disable thì trình duyệt bỏ luôn cả
        // sự kiện hover, và thẻ thông tin nhanh sẽ không bao giờ hiện ra.
        onDayClick={booking ? handleDayClick : handleViewDayClick}
        isDayDisabled={(date) => {
          if (!booking) return false;
          // Ngày đã qua thì không đặt được, và hôm nay cũng vậy một khi chi
          // nhánh đã đóng cửa — hai luật này BE đều chặn, mờ sẵn ở đây để khách
          // không phải chọn rồi mới biết.
          if (date < today) return true;
          if (date === today && !bookableToday) return true;
          // Sau khi chốt ngày bắt đầu của gói, chỉ các ngày TRONG gói mới thao
          // tác được — bấm ra ngoài không có nghĩa gì và chỉ gây hiểu nhầm.
          return ticket?.kind === "PACKAGE" && Boolean(startDate) && !dayIndexOf.has(date);
        }}
        dayClassName={({ date }) =>
          cn(
            !booking && entriesByDate.has(date) && "bg-primary/5",
            booking && dayIndexOf.has(date) && "bg-primary/5 ring-1 ring-inset ring-primary/40",
            booking && date === startDate && "ring-2 ring-primary",
          )
        }
        renderDay={renderDay}
      />

      {bookingTicket ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
          {startDate ? (
            <>
              <Badge variant="outline" className="gap-1">
                <CalendarDays className="size-3" />
                {bookingTicket.kind === "DAY"
                  ? startDate
                  : t("packageRange", { from: days[0], to: days[days.length - 1] })}
              </Badge>
              {bookingTicket.withPt ? (
                <span className="text-sm text-muted-foreground">
                  {t("ptAssigned", { done: assignedCount, total: days.length })}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              {bookingTicket.kind === "DAY" ? t("pickDate") : t("pickStartDate")}
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
      ) : null}

      {bookingTicket && openDay && bookingTicket.withPt ? (
        <DayComposer
          branchId={bookingTicket.gymBranchId}
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

      {detailDate ? (
        <SessionDetailDialog
          date={detailDate}
          entries={entriesByDate.get(detailDate) ?? []}
          onClose={() => setDetailDate(null)}
        />
      ) : null}
    </div>
  );
}

export type { Ticket };
