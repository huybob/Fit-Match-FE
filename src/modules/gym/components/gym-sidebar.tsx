"use client";

import Link from "next/link";
import {
  LayoutDashboard, ShieldCheck, Building2, Dumbbell, GitBranch, Sparkles,
  CalendarCheck2, CalendarClock, DollarSign, Banknote, Settings, LogOut, Users, Package, Images,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/auth.store";
import { gymService } from "@/services/gym.service";
import { roleLabelKey } from "@/shared/utils/enum-label.util";
import { useTranslations } from "next-intl";

// Links available before the gym is approved (submit + track verification only).
const ALWAYS_AVAILABLE = new Set(["/gym", "/gym/verification"]);

const gymLinks = [
  { href: "/gym", navKey: "dashboard", icon: LayoutDashboard },
  { href: "/gym/verification", navKey: "verification", icon: ShieldCheck },
  { href: "/gym/facilities", navKey: "facilities", icon: Dumbbell },
  { href: "/gym/branches", navKey: "branches", icon: GitBranch },
  { href: "/gym/media", navKey: "media", icon: Images },
  { href: "/gym/pts", navKey: "trainers", icon: Users },
  // BE V85: Gym là chủ lịch của PT — khai ca, xếp ca, duyệt đơn nghỉ.
  { href: "/gym/schedule", navKey: "shifts", icon: CalendarClock },
  { href: "/gym/services", navKey: "services", icon: Sparkles },
  { href: "/gym/packages", navKey: "packages", icon: Package },
  // Mô hình vé không còn "booking": lịch đặt của gym nằm ở /gym/calendar.
  // Href cũ /gym/bookings không có trang nào và cho 404.
  { href: "/gym/calendar", navKey: "bookings", icon: CalendarCheck2 },
  { href: "/gym/revenue", navKey: "revenue", icon: DollarSign },
  { href: "/gym/wallet", navKey: "wallet", icon: Banknote },
  { href: "/gym/settings", navKey: "settings", icon: Settings },
] as const;

export function GymSidebar() {
  const t = useTranslations();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const displayName = user?.fullName ?? user?.username ?? "Gym";
  const initial = displayName[0]?.toUpperCase() ?? "G";

  const { data: status } = useQuery({
    queryKey: ["gym-verification-status"],
    queryFn: gymService.getVerificationStatus,
  });
  const approved = status?.verificationStatus === "APPROVED";
  const suspended = status?.verificationStatus === "SUSPENDED";
  // Until approved, only expose the dashboard + verification entries.
  const visibleLinks = approved
    ? gymLinks
    : gymLinks.filter((l) => ALWAYS_AVAILABLE.has(l.href));

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
            <Building2 className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">FitMatch</p>
            {/* "Gym Operator Workspace" từng bị hardcode — không dịch sang tiếng Việt. */}
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("gym.workspace")}</p>
          </div>
        </div>
      </Link>

      {/* User info — top below brand */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t(roleLabelKey(user?.role))}</p>
          </div>
        </div>
      </div>

      {/* B-35: gym SUSPENDED trước đây hiển thị như hồ sơ mới, không banner */}
      {suspended && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 shrink-0">
          <p className="text-[11px] font-bold text-destructive">{t("gym.suspendedTitle")}</p>
          <p className="text-[10px] text-destructive mt-0.5">
            {t("gym.suspendedBody")}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {visibleLinks.map(({ href, navKey, icon: Icon }) => {
          const active = pathname === href || (href !== "/gym" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {t(`gym.nav.${navKey}`)}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="size-3.5" />{t("common.menu.logout")}</button>
      </div>
    </aside>
  );
}
