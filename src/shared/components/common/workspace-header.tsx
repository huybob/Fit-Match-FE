"use client";

import { NotificationBell } from "@/modules/notification/components/notification-bell";
import { WorkspaceUserMenu } from "./workspace-user-menu";

/**
 * Thanh header dùng chung cho các workspace (gym / trainer).
 * - Chuông dùng NotificationBell: badge là SỐ CHƯA ĐỌC THẬT từ
 *   GET /notifications/unread-count. Trước đây header này tự dựng lại chuông
 *   bằng một <Link> tĩnh kèm chấm đỏ hardcode — chấm luôn sáng kể cả khi
 *   không có thông báo nào (đúng lỗi E-6 đã sửa ở AdminShell nhưng còn sót
 *   lại ở đây).
 * - Bao gồm LocaleSwitch + ThemeSwitch + menu tài khoản qua WorkspaceUserMenu.
 * Tất cả icon-only đều có aria-label (WCAG AA).
 *
 * Render Ở LAYOUT (GymLayout/TrainerLayout), không phải ở từng page — trước đây
 * chỉ 9/21 trang workspace tự gắn header nên thanh này biến mất khi chuyển trang.
 */
export function WorkspaceHeader({ title }: { title?: string }) {
  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between gap-2 shrink-0 shadow-sm">
      <p className="min-w-0 truncate text-sm font-bold text-foreground">{title ?? ""}</p>
      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell className="relative size-9 flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
        <div className="w-px h-5 bg-border mx-1" />
        <WorkspaceUserMenu />
      </div>
    </header>
  );
}
