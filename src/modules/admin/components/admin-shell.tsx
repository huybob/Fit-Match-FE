"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard, Users, ShieldCheck, Tag,
  BarChart3, FileText, ClipboardList, LogOut,
  ChevronDown, UserCircle, Database,
  ShieldAlert, Star, Banknote, CalendarCheck, Undo2, Percent, Flag,
} from "lucide-react";
import { NotificationBell } from "@/modules/notification/components/notification-bell";
import { ResponsiveSidebar } from "@/shared/components/common/responsive-sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { ThemeSwitch } from "@/shared/components/common/theme-switch";

// D-1/E-7 (audit 2026-07-17): sidebar lọc theo role — MODERATOR chỉ thấy mảng kiểm duyệt,
// FINANCE_ADMIN chỉ thấy mảng tài chính (khớp @PreAuthorize của các Admin*Controller BE).
const ALL_ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_FINANCE_ADMIN"] as const;

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ROLE_ADMIN"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ROLE_ADMIN"] },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck, roles: ["ROLE_ADMIN"] },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck, roles: ["ROLE_ADMIN"] },
  { href: "/admin/disputes", label: "Disputes", icon: ShieldAlert, roles: ["ROLE_ADMIN", "ROLE_MODERATOR"] },
  { href: "/admin/reviews", label: "Reviews", icon: Star, roles: ["ROLE_ADMIN", "ROLE_MODERATOR"] },
  // UC-070/071: báo cáo vấn đề dịch vụ/hành vi (ngoài review)
  { href: "/admin/issue-reports", label: "Issue Reports", icon: Flag, roles: ["ROLE_ADMIN", "ROLE_MODERATOR"] },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/refunds", label: "Refunds", icon: Undo2, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/commission", label: "Commission", icon: Percent, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/vouchers", label: "Vouchers", icon: Tag, roles: ["ROLE_ADMIN"] },
  // Link Loyalty gỡ tạm (E-16): trang /admin/loyalty chưa tồn tại — thêm lại ở Phase 3.
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/cms", label: "CMS", icon: FileText, roles: ["ROLE_ADMIN"] },
  { href: "/admin/master-data", label: "Master Data", icon: Database, roles: ["ROLE_ADMIN"] },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList, roles: ["ROLE_ADMIN"] },
];

const roleLabels: Record<string, string> = {
  ROLE_ADMIN: "Quản trị viên",
  ROLE_MODERATOR: "Kiểm duyệt viên",
  ROLE_FINANCE_ADMIN: "Quản trị tài chính",
  ROLE_PT: "Huấn luyện viên",
  ROLE_GYM_OPERATOR: "Chủ phòng gym",
  ROLE_CUSTOMER: "Khách hàng",
};

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const visibleLinks = adminLinks.filter(({ roles }) =>
    (roles as readonly string[]).includes(user?.role ?? ""),
  );
  return (
    <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col h-screen">
      <Link href="/" className="block px-5 py-5 border-b border-border hover:bg-muted/40 transition-colors shrink-0">
        <p className="text-base font-bold text-foreground leading-tight">FitMatch</p>
        <p className="text-xs text-muted-foreground mt-0.5">Admin Console</p>
      </Link>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {visibleLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="size-4 shrink-0" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border shrink-0">
        <button onClick={onLogout} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function AdminHeader({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const label = user?.fullName ?? user?.username ?? "Admin";
  const role = roleLabels[user?.role ?? ""] ?? "Quản trị viên";
  const initial = label[0]?.toUpperCase() ?? "A";

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
      <p className="text-sm font-bold text-foreground">Admin Console</p>
      <div className="flex items-center gap-2">
        <ThemeSwitch />
        {/* E-6: badge số chưa đọc thật — chấm đỏ hardcode cũ luôn sáng bất kể có thông báo */}
        <NotificationBell className="relative size-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground" />
        <div className="w-px h-5 bg-muted mx-1" />
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 h-11 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{initial}</div>
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">{role}</p>
            </div>
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
                  <LayoutDashboard className="size-4" /> Về trang chủ
                </Link>
                <button onClick={() => { setOpen(false); onLogout(); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                  <LogOut className="size-4" /> Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
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
