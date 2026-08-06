"use client";

import Link from "next/link";
import { ChevronDown, Home, LogOut, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { UserAvatar } from "@/shared/components/common/user-avatar";
import { cn } from "@/shared/utils/cn.util";

/**
 * Menu tài khoản dùng chung cho mọi top bar (gym / trainer / admin).
 *
 * Trước đây 3 nơi tự dựng dropdown bằng `useState` + overlay `fixed inset-0`:
 * không đóng bằng Escape, không trả focus về nút, không có `role="menu"` nên
 * screen reader không biết đây là menu. Radix xử lý sẵn tất cả những điều đó.
 */
export function AccountMenu({
  name,
  subLabel,
  avatarUrl,
  homeHref = "/",
  homeLabel,
  onLogout,
  className,
}: {
  name: string;
  /** Dòng phụ dưới tên (vd. vai trò) — chỉ hiện khi có. */
  subLabel?: string;
  avatarUrl?: string | null;
  homeHref?: string;
  homeLabel?: string;
  onLogout: () => void;
  className?: string;
}) {
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.menu.account")}
        className={cn(
          "flex h-11 cursor-pointer items-center gap-2.5 rounded-lg pl-1.5 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <UserAvatar className="size-8 shrink-0" src={avatarUrl} name={name} tintSeed={0} />
        {/* Ẩn phần chữ dưới sm: ở 375px tên + vai trò không đủ chỗ trong thanh
            header cao 56px nên bị xuống dòng và tràn ra ngoài. Trigger đã có
            aria-label nên ẩn chữ không làm mất tên khả truy cập. */}
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          {subLabel ? (
            <span className="block truncate text-[11px] text-muted-foreground">{subLabel}</span>
          ) : null}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCircle className="size-4" /> {t("common.menu.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={homeHref}>
            <Home className="size-4" /> {homeLabel ?? t("common.menu.home")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLogout}>
          <LogOut className="size-4" /> {t("common.menu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
