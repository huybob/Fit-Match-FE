"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, CalendarDays, CalendarClock, CheckCircle2, Clock, Star, Ticket as TicketIcon, UserRound } from "lucide-react";
import { useFormatters } from "@/i18n/use-formatters";
import { useToast } from "@/lib/toast-provider";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Dialog } from "@/shared/components/ui/dialog";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/components/ui/popover";
import { toErrorMessage } from "@/shared/utils/error.util";
import { addDays, fromIsoDate, todayIso } from "../calendar-date.util";
import { ReviewCreateDialog } from "@/modules/review/components/review-create-dialog";
import { useMyReviewedTargets } from "@/modules/review/hooks/use-review";
import { useBranchBookingWindow, useUpdateSessionDate } from "../hooks/use-ticket";
import type { Ticket, TrainingSession } from "@/types/Ticket";

/**
 * Một buổi đã đặt kèm vé của nó. Buổi tập (`/sessions/my`) chỉ mang `ticketId`,
 * còn tên gói / phòng gym / chi nhánh nằm ở vé — nên chỗ nào muốn hiện "gói nào,
 * gym nào" đều phải ghép hai nguồn, và ghép ở FE bằng một Map thay vì gọi thêm
 * API cho từng buổi.
 */
export interface BookedSession {
  session: TrainingSession;
  ticket?: Ticket;
}

/** Số buổi hiện trong thẻ hover trước khi gom phần còn lại thành "+N". */
const HOVER_PREVIEW_LIMIT = 2;

/** Trễ trước khi đóng — đủ để chuột đi từ ô lịch sang thẻ mà thẻ không biến mất. */
const CLOSE_DELAY_MS = 140;

/**
 * Thẻ thông tin nhanh khi đưa chuột vào một ngày CÓ buổi đã đặt.
 *
 * Dùng `PopoverAnchor` chứ không `PopoverTrigger`: ô ngày của lịch vốn đã là một
 * `<button>` có hành vi click riêng (mở chi tiết / chọn ngày). Trigger sẽ gắn
 * thêm onClick toggle vào đúng chỗ đó và một cú bấm vừa mở hộp thoại vừa bật/tắt
 * popover. Anchor chỉ neo vị trí, còn đóng/mở do hover quyết định.
 */
export function SessionHoverCard({
  date,
  entries,
  onDetail,
  children,
}: {
  date: string;
  entries: BookedSession[];
  onDetail: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("ticket.schedule");
  const tStatus = useTranslations("common.sessionStatus");
  const fmt = useFormatters();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openNow() {
    cancelClose();
    setOpen(true);
  }

  function closeSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  useEffect(() => cancelClose, []);

  const preview = entries.slice(0, HOVER_PREVIEW_LIMIT);
  const hidden = entries.length - preview.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span
          className="flex w-full flex-col gap-0.5 overflow-hidden"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          {children}
        </span>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="start"
        className="w-72 space-y-2.5 p-3"
        // Popover mở bằng hover thì KHÔNG được cướp focus: con trỏ vẫn đang ở
        // lịch, kéo focus sang đây làm mất chỗ bấm và cuộn trang nhảy.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {fmt.date(fromIsoDate(date))}
        </p>

        {preview.map(({ session, ticket }) => (
          <div key={session.id} className="space-y-1 rounded-lg bg-muted/40 p-2">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">
                {ticket?.ticketTypeName ?? t("unknownTicket")}
              </p>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {tStatus(session.status)}
              </Badge>
            </div>

            {ticket && ticket.kind === "PACKAGE" ? (
              <p className="text-xs text-muted-foreground">
                {t("dayOfTotal", { index: session.dayIndex, total: ticket.dayCount })}
              </p>
            ) : null}

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {session.ptSlotStart ? (
                <>
                  <Clock className="size-3 shrink-0" />
                  {session.ptSlotStart.slice(0, 5)}
                  {session.ptSlotEnd ? `–${session.ptSlotEnd.slice(0, 5)}` : ""}
                  {session.ptName ? (
                    <>
                      <UserRound className="ml-1 size-3 shrink-0" />
                      <span className="truncate">{session.ptName}</span>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <UserRound className="size-3 shrink-0" />
                  {t("selfTraining")}
                </>
              )}
            </p>

            {ticket ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Building2 className="mt-0.5 size-3 shrink-0" />
                <span className="min-w-0">
                  {ticket.gymName} · {ticket.gymBranchName}
                </span>
              </p>
            ) : null}
          </div>
        ))}

        {hidden > 0 ? (
          <p className="text-xs text-muted-foreground">{t("moreSessions", { count: hidden })}</p>
        ) : null}

        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() => {
            setOpen(false);
            onDetail();
          }}
        >
          {t("viewDetail")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/** Chi tiết đầy đủ các buổi trong một ngày — mở từ thẻ hover hoặc khi bấm vào ô. */
export function SessionDetailDialog({
  date,
  entries,
  onClose,
}: {
  date: string;
  entries: BookedSession[];
  onClose: () => void;
}) {
  const t = useTranslations("ticket.schedule");
  const tStatus = useTranslations("common.sessionStatus");
  const fmt = useFormatters();
  const reviewed = useMyReviewedTargets();

  return (
    <Dialog open title={fmt.date(fromIsoDate(date))} onClose={onClose}>
      <div className="space-y-3">
        {entries.map(({ session, ticket }) => (
          <div key={session.id} className="space-y-2.5 rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  <TicketIcon className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{ticket?.ticketTypeName ?? t("unknownTicket")}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {ticket
                    ? ticket.kind === "DAY"
                      ? t("dayTicket")
                      : t("dayOfTotal", { index: session.dayIndex, total: ticket.dayCount })
                    : t("ticketRef", { id: session.ticketId })}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {tStatus(session.status)}
              </Badge>
            </div>

            <dl className="space-y-1.5 text-sm">
              <Row
                icon={<Building2 className="size-3.5" />}
                label={t("gymLabel")}
                value={ticket ? `${ticket.gymName} · ${ticket.gymBranchName}` : "—"}
              />
              <Row
                icon={<Clock className="size-3.5" />}
                label={t("slotLabel")}
                value={
                  session.ptSlotStart
                    ? `${session.ptSlotStart.slice(0, 5)}${
                        session.ptSlotEnd ? `–${session.ptSlotEnd.slice(0, 5)}` : ""
                      }`
                    : t("noSlot")
                }
              />
              <Row
                icon={<UserRound className="size-3.5" />}
                label={t("ptLabel")}
                value={session.ptName ?? t("selfTraining")}
              />
              {session.checkedInAt ? (
                <Row
                  icon={<CheckCircle2 className="size-3.5 text-success" />}
                  label={t("checkedInAt")}
                  value={fmt.dateTime(session.checkedInAt)}
                />
              ) : null}
            </dl>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href="/profile/tickets">{t("openTicket")}</Link>
              </Button>
              {ticket?.gymProfileId ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/gyms/${ticket.gymProfileId}`}>{t("openGym")}</Link>
                </Button>
              ) : null}
              <PtReviewAction
                session={session}
                reviewed={reviewed.sessionIds.has(session.id)}
              />
            </div>

            <RescheduleSection session={session} ticket={ticket} onDone={onClose} />
          </div>
        ))}
      </div>
    </Dialog>
  );
}

/**
 * Câu 36: đánh giá HLV mở ngay khi BUỔI đó xong — khác đánh giá phòng gym (mở
 * khi dùng hết vé, một lần cho cả vé). Buổi tự tập không có ai để chấm.
 *
 * <p>Trước đây không có lối vào nào: endpoint và service đều có, nhưng không màn
 * hình nào gọi, nên đánh giá PT tồn tại trên giấy. Nút nằm ngay trong chi tiết
 * buổi vì đó là chỗ khách nhìn thấy đúng buổi mình vừa tập và tên HLV của nó.
 */
function PtReviewAction({
  session,
  reviewed,
}: {
  session: TrainingSession;
  reviewed: boolean;
}) {
  const t = useTranslations("ticket.schedule");
  const fmt = useFormatters();
  const [open, setOpen] = useState(false);

  if (session.status !== "DONE" || session.ptProfileId == null) return null;

  if (reviewed) {
    return (
      <Button asChild size="sm" variant="ghost">
        <Link href="/profile/reviews">
          <Star className="mr-1.5 size-3.5 fill-current text-warning" />
          {t("ptReviewed")}
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Star className="mr-1.5 size-3.5" />
        {t("reviewPt")}
      </Button>
      {open && (
        <ReviewCreateDialog
          target={{
            kind: "pt",
            sessionId: session.id,
            name: session.ptName ?? "",
            // Ngày hiển thị, không phải ISO thô: câu dẫn của form là câu đọc.
            date: fmt.date(fromIsoDate(session.sessionDate)),
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Dời ngày tập — chỉ hiện khi BE thật sự nhận (luật ở SessionSchedulingValidator):
 * vé DAY còn dùng được, buổi chưa diễn ra, và chưa qua mốc 00:00 của ngày tập.
 * Vé gói không đổi lịch từng ngày được, nên hiện nút ở đó chỉ để nhận 409.
 *
 * Không tự đoán hộ phần PT: buổi có PT thì ngày mới phải còn đúng khung giờ đó,
 * điều kiện này chỉ server biết. FE nói trước bằng một dòng gợi ý rồi để lỗi
 * thật của server hiện nguyên văn nếu PT bận.
 */
function RescheduleSection({
  session,
  ticket,
  onDone,
}: {
  session: TrainingSession;
  ticket?: Ticket;
  onDone: () => void;
}) {
  const t = useTranslations("ticket.schedule");
  const { toast } = useToast();
  const update = useUpdateSessionDate();
  // Cùng luật với lịch đặt: chi nhánh đóng cửa rồi thì hôm nay không còn là
  // đích dời hợp lệ nữa, nên sớm nhất là ngày mai.
  const { bookableToday, closeTime } = useBranchBookingWindow(
    ticket?.gymProfileId,
    ticket?.gymBranchId,
  );
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");

  const today = todayIso();
  const canReschedule =
    ticket?.kind === "DAY" &&
    ticket.status === "ACTIVE" &&
    session.status === "SCHEDULED" &&
    session.sessionDate > today;

  if (!canReschedule) return null;

  const expiry = ticket.expiresAt ? ticket.expiresAt.slice(0, 10) : undefined;

  async function submit() {
    if (!date) return;
    try {
      await update.mutateAsync({ sessionId: session.id, date });
      toast({ type: "success", title: t("rescheduled") });
      onDone();
    } catch (error) {
      toast({ type: "error", title: t("rescheduleFailed"), description: toErrorMessage(error) });
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CalendarClock className="mr-1.5 size-3.5" />
        {t("reschedule")}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold">{t("rescheduleTitle")}</p>
      <DatePicker
        value={date || null}
        onChange={(value) => setDate(value ?? "")}
        // Hạn dùng của vé là trần cứng: dời quá hạn thì server từ chối, chặn ở
        // đây để khách không chọn xong mới biết.
        minDate={bookableToday ? today : addDays(today, 1)}
        maxDate={expiry}
        placeholder={t("reschedulePlaceholder")}
        className="h-9 w-full"
      />
      {!bookableToday && closeTime ? (
        <p className="text-xs text-muted-foreground">{t("closedTodayAt", { time: closeTime })}</p>
      ) : null}
      {session.ptName ? (
        <p className="text-xs text-muted-foreground">
          {t("reschedulePtHint", {
            pt: session.ptName,
            time: session.ptSlotStart?.slice(0, 5) ?? "",
          })}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setDate("");
          }}
          disabled={update.isPending}
        >
          {t("rescheduleCancel")}
        </Button>
        <Button size="sm" onClick={submit} disabled={!date || update.isPending}>
          {t("rescheduleConfirm")}
        </Button>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 text-right font-medium">{value}</dd>
    </div>
  );
}
