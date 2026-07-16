"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, UserCircle, Home, LogOut } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ThemeSwitch } from "@/shared/components/common/theme-switch";

/**
 * Account dropdown for workspace top bars (gym / trainer).
 * Self-contained: reads the current user and handles logout.
 */
export function WorkspaceUserMenu() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const label = user?.fullName ?? user?.username ?? "Tài khoản";
  const initial = label[0]?.toUpperCase() ?? "U";

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-1">
      <ThemeSwitch />
      <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu tài khoản"
        aria-expanded={open}
        className="flex items-center gap-2.5 pl-1 pr-2 h-9 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {initial}
        </div>
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-border bg-card p-2 shadow-xl">
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/40">
              <UserCircle className="size-4" /> Hồ sơ
            </Link>
            <Link href="/" onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/40">
              <Home className="size-4" /> Về trang chủ
            </Link>
            <button onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut className="size-4" /> Đăng xuất
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
