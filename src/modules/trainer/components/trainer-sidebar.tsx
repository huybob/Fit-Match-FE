"use client";

import Link from "next/link";
import {
  UserRound, LogOut, Dumbbell, CalendarClock, CalendarCheck2, Star,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { IconButton } from "@/shared/components/ui/icon-button";
import { roleLabelKey } from "@/shared/utils/enum-label.util";
import { useTranslations } from "next-intl";

// PTs are managed by their Gym; the PT workspace is a lean self-service
// (profile + assigned shifts & leave requests + assigned bookings + reviews).
// BE V85: PT no longer declares availability — the Gym rosters them into shifts.
const ptLinks = [
  { href: "/trainer", navKey: "profile", icon: UserRound },
  { href: "/trainer/availability", navKey: "availability", icon: CalendarClock },
  { href: "/trainer/bookings", navKey: "bookings", icon: CalendarCheck2 },
  { href: "/trainer/reviews", navKey: "reviews", icon: Star },
] as const;

export function TrainerSidebar() {
  const t = useTranslations();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-screen">
      {/* Brand — click to go back home */}
      <Link href="/" className="block px-5 pt-6 pb-4 border-b border-border hover:bg-muted/40 transition-colors shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">FitMatch</p>
            {/* "Trainer Hub" từng bị hardcode — không dịch sang tiếng Việt. */}
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("trainer.workspace")}</p>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {ptLinks.map(({ href, navKey, icon: Icon }) => {
          const active = pathname === href || (href !== "/trainer" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {t(`trainer.nav.${navKey}`)}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {(user?.fullName ?? user?.username ?? "T")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground truncate">{user?.fullName ?? user?.username}</p>
            <p className="text-[10px] text-muted-foreground">{t(roleLabelKey(user?.role))}</p>
          </div>
          <IconButton tooltip={t("common.menu.logout")} onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </aside>
  );
}
