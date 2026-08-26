"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CreditCard,
  ShieldAlert,
  Star,
  Ticket as TicketIcon,
} from "lucide-react";
import { formatCurrency } from "@/utils/format.util";
import { useToast } from "@/lib/toast-provider";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn.util";
import { daysUntil } from "../calendar-date.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useFormatters } from "@/i18n/use-formatters";
import { useMyDisputes } from "@/modules/dispute/hooks/use-dispute";
import { ReviewCreateDialog } from "@/modules/review/components/review-create-dialog";
import { useMyReviewedTargets } from "@/modules/review/hooks/use-review";
import { useMyTickets, useOpenTicketDispute } from "../hooks/use-ticket";
import type { Dispute } from "@/types/Dispute";
import type { Ticket, TicketStatus } from "@/types/Ticket";

/*
 * Bộ lọc trạng thái — "" = tất cả.
 *
 * Khoá i18n viết đủ chứ không ghép `filter.${labelKey}`: messages.d.ts kiểm khoá
 * ở compile-time, và chuỗi ghép làm union phồng lên tới mức tsc bỏ cuộc
 * ("union type that is too complex to represent") — mất luôn phần kiểm tra.
 */
const FILTERS = [
  { value: "", labelKey: "ticket.myTickets.filter.all" },
  { value: "PENDING_PAYMENT", labelKey: "ticket.myTickets.filter.pendingPayment" },
  { value: "ACTIVE", labelKey: "ticket.myTickets.filter.active" },
  { value: "USED_UP", labelKey: "ticket.myTickets.filter.usedUp" },
  // Ba trạng thái cuối vòng đời vé: trước đây chỉ tìm được qua "Tất cả", nên
  // khách có mươi vé cũ phải cuộn cả danh sách để tìm một vé đã hoàn tiền.
  { value: "EXPIRED", labelKey: "ticket.myTickets.filter.expired" },
  { value: "CANCELLED", labelKey: "ticket.myTickets.filter.cancelled" },
  { value: "REFUNDED", labelKey: "ticket.myTickets.filter.refunded" },
] as const satisfies ReadonlyArray<{ value: "" | TicketStatus; labelKey: string }>;

/**
 * Trạng thái vé mở được tranh chấp — khớp DISPUTABLE_TICKET_STATES của
 * TicketDisputeServiceImpl. Vé chưa thanh toán chưa có tiền để tranh chấp; vé đã
 * huỷ/hoàn thì đã có kết luận. EXPIRED vẫn mở được: hết hạn chặn hoàn tiền tự
 * động, nên tranh chấp là đường duy nhất còn lại của khách.
 */
const DISPUTABLE_STATUSES: TicketStatus[] = ["ACTIVE", "USED_UP", "EXPIRED"];

/** Tranh chấp còn "sống" — BE từ chối mở cái thứ hai khi vé đang có một cái. */
const OPEN_DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "ESCALATED"];

/**
 * "Vé của tôi" — điểm quay lại sau khi mua.
 *
 * Trước đây chỉ có đúng một lối tới trang đặt lịch: chuyển hướng tự động ngay
 * sau khi thanh toán. Đóng tab là mất luôn đường vào, vì không màn hình nào liệt
 * kê vé đã mua. Trang này là chỗ đó.
 */
export function MyTicketsPage() {
  const t = useTranslations("ticket.myTickets");
  const tRoot = useTranslations();
  const [status, setStatus] = useState<"" | TicketStatus>("");

  const { data, isLoading } = useMyTickets(status ? { status, size: 50 } : { size: 50 });
  const tickets = data?.content ?? [];

  /*
   * Tranh chấp đang mở của chính khách — dùng để đổi nút "Mở tranh chấp" thành
   * lối vào tranh chấp đã có. Không có nó thì bấm lần hai chỉ nhận về lỗi 409
   * "Vé này đang có một tranh chấp chưa được giải quyết".
   */
  /*
   * Vé nào đã đánh giá rồi — nút "Đánh giá phòng gym" phải biến thành lối vào
   * đánh giá đã có, chứ không mời lần hai rồi để BE trả 409 "Vé này đã được
   * đánh giá".
   */
  const reviewed = useMyReviewedTargets();

  const disputes = useMyDisputes();
  const openByTicket = useMemo(() => {
    const map = new Map<number, Dispute>();
    for (const d of disputes.data?.content ?? []) {
      if (d.ticketId != null && OPEN_DISPUTE_STATUSES.includes(d.status)) {
        map.set(d.ticketId, d);
      }
    }
    return map;
  }, [disputes.data]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              status === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {tRoot(filter.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !tickets.length ? (
        <EmptyState title={t("empty")} description={t("emptyHint")} />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              openDispute={openByTicket.get(ticket.id)}
              reviewed={reviewed.ticketIds.has(ticket.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketRow({
  ticket,
  openDispute,
  reviewed,
}: {
  ticket: Ticket;
  openDispute?: Dispute;
  /** Vé này đã có đánh giá phòng gym (mọi trạng thái — BE chặn theo vé). */
  reviewed: boolean;
}) {
  const t = useTranslations("ticket.myTickets");
  const tStatus = useTranslations("common.ticketStatus");
  const tDispute = useTranslations("ticket.myTickets.dispute");
  const fmt = useFormatters();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const scheduled = ticket.scheduledDays ?? 0;
  const needsScheduling = ticket.status === "ACTIVE" && scheduled < ticket.dayCount;

  /*
   * Hạn khiếu nại do server tính (DisputeWindow) — null nghĩa là vé chưa kết
   * toán nên chưa bắt đầu đếm. Quá hạn thì ẩn nút và nói rõ lý do: nút biến mất
   * không lời giải thích là kiểu hỏng đắt nhất trong luồng liên quan tiền.
   */
  const daysLeftToDispute = ticket.disputeDeadline ? daysUntil(ticket.disputeDeadline) : null;
  const disputeWindowClosed = daysLeftToDispute != null && daysLeftToDispute < 0;
  const disputableStatus = DISPUTABLE_STATUSES.includes(ticket.status);
  const canDispute = disputableStatus && !disputeWindowClosed;

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TicketIcon className="size-4 shrink-0 text-primary" />
          <span className="font-semibold">{ticket.ticketTypeName}</span>
          <Badge variant="outline">{tStatus(ticket.status)}</Badge>
          {ticket.withPt ? <Badge variant="outline">{t("withPt")}</Badge> : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {ticket.gymName} · {ticket.gymBranchName}
        </p>
        <p className="mt-1 text-sm">
          {formatCurrency(ticket.payableAmount)} ·{" "}
          {t("scheduledOf", { done: scheduled, total: ticket.dayCount })}
          {ticket.minutesPerDay ? ` · ${t("minutesPerSession", { minutes: ticket.minutesPerDay })}` : ""}
          {ticket.expiresAt ? ` · ${t("expiresAt", { date: ticket.expiresAt.slice(0, 10) })}` : ""}
        </p>
        {/* Danh sách sắp theo ngày tạo (mới nhất trước) thì phải in ngày ra —
            không có nó thì thứ tự trông như tuỳ hứng. Dùng createdAt chứ không
            phải purchasedAt: vé chờ thanh toán chưa có purchasedAt. */}
        {ticket.createdAt ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("createdAt", { date: fmt.dateTime(ticket.createdAt) })}
          </p>
        ) : null}
        {disputableStatus && daysLeftToDispute != null ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {disputeWindowClosed
              ? tDispute("windowClosed", { date: ticket.disputeDeadline!.slice(0, 10) })
              : tDispute("daysLeft", { days: daysLeftToDispute })}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {ticket.status === "PENDING_PAYMENT" ? (
          <Button asChild size="sm">
            <Link href={`/checkout?ticketId=${ticket.id}`}>
              <CreditCard className="mr-1.5 size-3.5" />
              {t("pay")}
            </Link>
          </Button>
        ) : null}

        {needsScheduling ? (
          <Button asChild size="sm">
            {/* mode=book: bấm "Xếp lịch" là muốn chọn ngày ngay, không phải xem
                lại lịch cũ — /schedule mặc định mở ở chế độ xem. */}
            <Link href={`/schedule?ticketId=${ticket.id}&mode=book`}>
              <CalendarDays className="mr-1.5 size-3.5" />
              {t("schedule")}
            </Link>
          </Button>
        ) : null}

        {ticket.status === "ACTIVE" && !needsScheduling ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/schedule?ticketId=${ticket.id}`}>
              <CalendarDays className="mr-1.5 size-3.5" />
              {t("viewSchedule")}
            </Link>
          </Button>
        ) : null}

        {/* Câu 17: đánh giá phòng gym mở khi vé đã DÙNG HẾT. Trước đây nút này
            chỉ dẫn sang /profile/reviews — trang đó chỉ SỬA đánh giá đã có, nên
            khách không có đường nào tạo cái đầu tiên. Giờ mở form tại chỗ; đã
            đánh giá rồi thì đổi thành lối vào xem lại. */}
        {ticket.status === "USED_UP" ? (
          reviewed ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/profile/reviews">
                <Star className="mr-1.5 size-3.5 fill-current text-warning" />
                {t("reviewed")}
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
              <Star className="mr-1.5 size-3.5" />
              {t("review")}
            </Button>
          )
        ) : null}

        {/* Vé đang tranh chấp thì không mời mở thêm — dẫn thẳng tới hồ sơ đang
            có để khách gửi bằng chứng, đó mới là việc còn lại của họ. */}
        {disputableStatus && openDispute ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/profile/disputes">
              <ShieldAlert className="mr-1.5 size-3.5 text-destructive" />
              {tDispute("view")}
            </Link>
          </Button>
        ) : canDispute ? (
          <Button size="sm" variant="ghost" onClick={() => setDisputeOpen(true)}>
            <ShieldAlert className="mr-1.5 size-3.5" />
            {tDispute("open")}
          </Button>
        ) : null}
      </div>

      {reviewOpen && (
        <ReviewCreateDialog
          target={{ kind: "gym", ticketId: ticket.id, name: ticket.gymName }}
          onClose={() => setReviewOpen(false)}
        />
      )}

      {disputeOpen && (
        <OpenDisputeDialog ticket={ticket} onClose={() => setDisputeOpen(false)} />
      )}
    </li>
  );
}

/**
 * Mở tranh chấp CẤP VÉ.
 *
 * Danh sách vé không kèm `sessions` (BE để null cho nhẹ), nên ở đây không chọn
 * được buổi cụ thể — và cấp vé cũng là mức khách cần nhất: nó đóng băng toàn bộ
 * phần tiền đang giữ thay vì chỉ giá trị một ngày. Tranh chấp cấp buổi vẫn đi
 * qua cùng endpoint với `sessionId`, dành cho màn lịch của vé.
 */
function OpenDisputeDialog({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const t = useTranslations("ticket.myTickets.dispute");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const openDispute = useOpenTicketDispute();
  const [reason, setReason] = useState("");

  async function submit() {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast({ type: "warning", title: t("reasonRequired") });
      return;
    }
    try {
      await openDispute.mutateAsync({ ticketId: ticket.id, reason: trimmed });
      toast({ type: "success", title: t("opened"), description: t("openedHint") });
      onClose();
    } catch (e) {
      toast({
        type: "error",
        title: tCommon("states.failed"),
        description: toErrorMessage(e),
      });
    }
  }

  return (
    <Dialog open title={t("dialogTitle")} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {ticket.ticketTypeName} · {ticket.gymName} · {formatCurrency(ticket.payableAmount)}
      </p>
      <p className="mt-3 rounded-2xl bg-muted/40 p-3 text-sm text-muted-foreground">
        {t("hint")}
      </p>
      <Textarea
        className="mt-3"
        rows={4}
        maxLength={2000}
        placeholder={t("reasonPlaceholder")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={openDispute.isPending}>
          {tCommon("actions.cancel")}
        </Button>
        <Button onClick={submit} disabled={openDispute.isPending}>
          <ShieldAlert className="mr-1.5 size-4" />
          {t("submit")}
        </Button>
      </div>
    </Dialog>
  );
}
