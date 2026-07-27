"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { WorkspaceUserMenu } from "./workspace-user-menu";
import { useTranslations } from "next-intl";

/**
 * Thanh header dùng chung cho các workspace (gym / trainer).
 * - Bell là link thật tới /notifications (thay ô tìm kiếm "trang trí" cũ).
 * - Bao gồm ThemeSwitch + menu tài khoản qua WorkspaceUserMenu.
 * Tất cả icon-only đều có aria-label (WCAG AA).
 */
export function WorkspaceHeader({ title }: { title?: string }) {
  const t = useTranslations();
  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
      <p className="truncate text-sm font-bold text-foreground">{title ?? ""}</p>
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          aria-label={t("notification.title")}
          className="relative size-9 flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
        </Link>
        <div className="w-px h-5 bg-border mx-1" />
        <WorkspaceUserMenu />
      </div>
    </header>
  );
}
