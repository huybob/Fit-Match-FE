"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, CreditCard, Star, Ticket as TicketIcon } from "lucide-react";
import { formatCurrency } from "@/utils/format.util";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { useMyTickets } from "../hooks/use-ticket";
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
] as const satisfies ReadonlyArray<{ value: "" | TicketStatus; labelKey: string }>;

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
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const t = useTranslations("ticket.myTickets");
  const tStatus = useTranslations("common.ticketStatus");

  const scheduled = ticket.scheduledDays ?? 0;
  const needsScheduling = ticket.status === "ACTIVE" && scheduled < ticket.dayCount;

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
          {ticket.expiresAt ? ` · ${t("expiresAt", { date: ticket.expiresAt.slice(0, 10) })}` : ""}
        </p>
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

        {ticket.status === "USED_UP" ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/profile/reviews">
              <Star className="mr-1.5 size-3.5" />
              {t("review")}
            </Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
