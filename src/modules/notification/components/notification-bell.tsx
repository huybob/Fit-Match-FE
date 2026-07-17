"use client";

// E-6 (audit 2026-07-17): trước đây useUnreadCount (poll 60s) có 0 consumer —
// chuông là Link tĩnh, riêng admin còn chấm đỏ hardcode luôn sáng. Badge này
// hiển thị số chưa đọc thật từ GET /notifications/unread-count.

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadCount } from "../hooks/use-notification";

export function NotificationBell({ className }: { className?: string }) {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Thông báo (${count} chưa đọc)` : "Thông báo"}
      className={
        className ??
        "relative inline-flex size-9 items-center justify-center rounded-md bg-muted/40 text-muted-foreground ring-1 ring-border"
      }
    >
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
