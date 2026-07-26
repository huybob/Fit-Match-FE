"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import {
  LayoutDashboard, Users, ShieldCheck, Tag,
  BarChart3, FileText, ClipboardList, LogOut,
  Database,
  ShieldAlert, Star, Banknote, CalendarCheck, Undo2, Percent, Flag, BellRing,
  Landmark,
} from "lucide-react";
import { NotificationBell } from "@/modules/notification/components/notification-bell";
import { ResponsiveSidebar } from "@/shared/components/common/responsive-sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { AccountMenu } from "@/shared/components/common/account-menu";
import { LocaleSwitch } from "@/shared/components/common/locale-switch";
import { ThemeSwitch } from "@/shared/components/common/theme-switch";
import { roleLabelKey } from "@/shared/utils/enum-label.util";

// D-1/E-7 (audit 2026-07-17): sidebar lọc theo role — MODERATOR chỉ thấy mảng kiểm duyệt,
// FINANCE_ADMIN chỉ thấy mảng tài chính (khớp @PreAuthorize của các Admin*Controller BE).
const ALL_ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_FINANCE_ADMIN"] as const;

const adminLinks = [
  { href: "/admin", navKey: "dashboard", icon: LayoutDashboard, roles: ["ROLE_ADMIN"] },
  { href: "/admin/users", navKey: "users", icon: Users, roles: ["ROLE_ADMIN"] },
  { href: "/admin/verification", navKey: "verification", icon: ShieldCheck, roles: ["ROLE_ADMIN"] },
  { href: "/admin/bookings", navKey: "bookings", icon: CalendarCheck, roles: ["ROLE_ADMIN"] },
  { href: "/admin/disputes", navKey: "disputes", icon: ShieldAlert, roles: ["ROLE_ADMIN", "ROLE_MODERATOR"] },
  { href: "/admin/reviews", navKey: "reviews", icon: Star, roles: ["ROLE_ADMIN", "ROLE_MODERATOR"] },
  // UC-070/071: báo cáo vấn đề dịch vụ/hành vi (ngoài review)
  { href: "/admin/issue-reports", navKey: "issueReports", icon: Flag, roles: ["ROLE_ADMIN", "ROLE_MODERATOR"] },
  { href: "/admin/withdrawals", navKey: "withdrawals", icon: Banknote, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/refunds", navKey: "refunds", icon: Undo2, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  // UC-053/056: tiền vào tài khoản nền tảng chưa gắn được vào booking
  { href: "/admin/payments", navKey: "reconciliation", icon: Landmark, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/commission", navKey: "commission", icon: Percent, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/vouchers", navKey: "vouchers", icon: Tag, roles: ["ROLE_ADMIN"] },
  // Link Loyalty gỡ tạm (E-16): trang /admin/loyalty chưa tồn tại — thêm lại ở Phase 3.
  { href: "/admin/analytics", navKey: "analytics", icon: BarChart3, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/cms", navKey: "cms", icon: FileText, roles: ["ROLE_ADMIN"] },
  // UC-075: template thông báo theo sự kiện
  { href: "/admin/notification-templates", navKey: "notifications", icon: BellRing, roles: ["ROLE_ADMIN"] },
  { href: "/admin/master-data", navKey: "masterData", icon: Database, roles: ["ROLE_ADMIN"] },
  { href: "/admin/audit-logs", navKey: "auditLogs", icon: ClipboardList, roles: ["ROLE_ADMIN"] },
] as const;

/* Nhãn role dùng chung từ enum-label.util (trước đây khai lại ở đây). */

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const visibleLinks = adminLinks.filter(({ roles }) =>
    (roles as readonly string[]).includes(user?.role ?? ""),
  );
  return (
    <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col h-screen">
      <Link href="/" className="block px-5 py-5 border-b border-border hover:bg-muted/40 transition-colors shrink-0">
        <p className="text-base font-bold text-foreground leading-tight">FitMatch</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("admin.console")}</p>
      </Link>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {visibleLinks.map(({ href, navKey, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {t(`admin.nav.${navKey}`)}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border shrink-0">
        <button onClick={onLogout} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="size-3.5" /> {t("common.menu.logout")}
        </button>
      </div>
    </aside>
  );
}

function AdminHeader({ onLogout }: { onLogout: () => void }) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const label = user?.fullName ?? user?.username ?? "Admin";
  const role = t(roleLabelKey(user?.role));

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
      <p className="text-sm font-bold text-foreground">{t("admin.console")}</p>
      <div className="flex items-center gap-2">
        <LocaleSwitch />
        <ThemeSwitch />
        {/* E-6: badge số chưa đọc thật — chấm đỏ hardcode cũ luôn sáng bất kể có thông báo */}
        <NotificationBell className="relative size-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground" />
        <div className="w-px h-5 bg-muted mx-1" />
        <AccountMenu
          name={label}
          subLabel={role}
          avatarUrl={user?.avatarUrl}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <AuthGuard roles={[...ALL_ADMIN_ROLES]}>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {/* F-30: mobile dùng drawer, desktop giữ sidebar cố định */}
        <ResponsiveSidebar>
          <AdminSidebar onLogout={handleLogout} />
        </ResponsiveSidebar>
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <AdminHeader onLogout={handleLogout} />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
