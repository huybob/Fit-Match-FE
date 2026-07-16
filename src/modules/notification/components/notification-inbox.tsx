"use client";

import { CheckCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/toast-provider";
import type { NotificationCategory, NotificationItem } from "@/services/notification.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/use-notification";

const categoryLabels: Record<NotificationCategory, string> = {
  BOOKING: "Đặt lịch",
  PAYMENT: "Thanh toán",
  SETTLEMENT: "Đối soát",
  DISPUTE: "Tranh chấp",
  REVIEW: "Đánh giá",
  ACCOUNT: "Tài khoản",
  SYSTEM: "Hệ thống",
  MARKETING: "Khuyến mãi",
};

function timeText(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function NotificationInbox() {
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const { toast } = useToast();
  const items = query.data?.content ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">Hộp thư thông báo</h2>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={async () => {
              try {
                await markAll.mutateAsync();
              } catch (e) {
                toast({ type: "error", title: "Thất bại", description: toErrorMessage(e) });
              }
            }}
          >
            <CheckCheck className="size-4" /> Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được thông báo" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title="Chưa có thông báo" description="Các cập nhật về đặt lịch, thanh toán, tranh chấp... sẽ hiển thị ở đây." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationRow key={n.id} item={n} onOpen={() => !n.read && markRead.mutate(n.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ item, onOpen }: { item: NotificationItem; onOpen: () => void }) {
  const inner = (
    <div
      className={cn(
        "rounded-2xl border p-4 transition",
        item.read ? "border-border bg-card" : "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
          {categoryLabels[item.category]}
        </span>
        <span className="text-xs text-muted-foreground">{timeText(item.createdAt)}</span>
      </div>
      <p className="mt-2 font-bold">{item.title}</p>
      {item.body && <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>}
    </div>
  );

  if (item.link) {
    return (
      <li>
        <Link href={item.link} onClick={onOpen} className="block">
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button type="button" className="block w-full text-left" onClick={onOpen}>
        {inner}
      </button>
    </li>
  );
}
