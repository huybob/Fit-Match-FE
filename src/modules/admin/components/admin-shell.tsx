"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import {
  LayoutDashboard, Users, ShieldCheck, Tag,
  FileText, ClipboardList, LogOut,
  Database,
  ShieldAlert, Star, Banknote, Undo2, Percent, Flag, BellRing,
  Landmark, MapPin,
} from "lucide-react";
import { NotificationBell } from "@/modules/notification/components/notification-bell";
import { ResponsiveSidebar } from "@/shared/components/common/responsive-sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { AccountMenu } from "@/shared/components/common/account-menu";
import { LocaleSwitch } from "@/shared/components/common/locale-switch";
import { ThemeSwitch } from "@/shared/components/common/theme-switch";
import { roleLabelKey } from "@/shared/utils/enum-label.util";
import { getHomeRouteForRole } from "@/modules/auth/auth-routing";

// D-1/E-7 (audit 2026-07-17): sidebar lọc theo role — MODERATOR chỉ thấy mảng kiểm duyệt,
// FINANCE_ADMIN chỉ thấy mảng tài chính (khớp @PreAuthorize của các Admin*Controller BE).
const ALL_ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_MODERATOR", "ROLE_FINANCE_ADMIN"] as const;

const adminLinks = [
  // "Tổng quan" = báo cáo vận hành/tài chính (gộp từ mục "Phân tích" cũ) — FINANCE_ADMIN
  // xem được nên có trong roles.
  { href: "/admin", navKey: "dashboard", icon: LayoutDashboard, roles: ["ROLE_ADMIN", "ROLE_FINANCE_ADMIN"] },
  { href: "/admin/users", navKey: "users", icon: Users, roles: ["ROLE_ADMIN"] },
  { href: "/admin/verification", navKey: "verification", icon: ShieldCheck, roles: ["ROLE_ADMIN"] },
  // Mục "Lịch đặt" gỡ đi: /admin/bookings không có trang (mô hình booking đã bị
  // thay bằng vé) nên link chỉ dẫn tới 404. Vé toàn sàn có API /admin/tickets
  // nhưng chưa có màn hình — thêm lại mục này khi trang đó tồn tại.
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
  // Mục "Phân tích" (/admin/analytics) đã gộp vào "Tổng quan" ở trên.
  { href: "/admin/cms", navKey: "cms", icon: FileText, roles: ["ROLE_ADMIN"] },
  // UC-075: template thông báo theo sự kiện
  { href: "/admin/notification-templates", navKey: "notifications", icon: BellRing, roles: ["ROLE_ADMIN"] },
  { href: "/admin/master-data", navKey: "masterData", icon: Database, roles: ["ROLE_ADMIN"] },
  // UC-18 (V59/V60): gym thiếu toạ độ thì vô hình trong "tìm quanh đây" — cần chỗ nhìn thấy điều đó.
  { href: "/admin/geocoding", navKey: "geocoding", icon: MapPin, roles: ["ROLE_ADMIN"] },
  { href: "/admin/audit-logs", navKey: "auditLogs", icon: ClipboardList, roles: ["ROLE_ADMIN"] },
] as const;

/* Nhãn role dùng chung từ enum-label.util (trước đây khai lại ở đây). */

/**
 * BUG-13: bảng `adminLinks` trước đây CHỈ dùng để lọc sidebar, nên gõ thẳng URL
 * của trang ngoài quyền (moderator -> /admin/users) vẫn render đủ shell + page;
 * page mount rồi gọi API, BE trả 403, UI hiện "Access denied" và nút thử lại còn
 * bắn thêm 403. Dữ liệu vẫn an toàn nhờ BE, nhưng đây là lỗ hổng defense-in-depth
 * và UX tệ. Nay dùng chính bảng đó làm guard — một nguồn sự thật duy nhất.
 *
 * Khớp tiền tố để trang con (vd /admin/disputes/12) thừa hưởng quyền của trang cha;
 * lấy entry khớp DÀI NHẤT vì "/admin" là tiền tố của mọi đường dẫn admin.
 */
function rolesForAdminPath(pathname: string): readonly string[] | null {
  const match = adminLinks
    .filter(({ href }) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? match.roles : null;
}

/** Màn 403 thân thiện: nói rõ vì sao và đưa người dùng về đúng khu vực của họ. */
function AdminForbidden() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const home = getHomeRouteForRole(user?.role);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-bold text-foreground">{t("admin.forbidden.title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("admin.forbidden.body", { role: t(roleLabelKey(user?.role)) })}
      </p>
      <Link
        href={home}
        className="mt-2 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("admin.forbidden.backToWorkspace")}
      </Link>
    </div>
  );
}

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
    <header className="bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between gap-2 shrink-0">
      {/* min-w-0 + truncate: không có thì tiêu đề xuống dòng và đội cao header 56px. */}
      <p className="min-w-0 truncate text-sm font-bold text-foreground">{t("admin.console")}</p>
      <div className="flex shrink-0 items-center gap-2">
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
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  // BUG-13: quyết định TRƯỚC khi render children. Render page rồi mới báo lỗi là
  // đã quá muộn — page đã kịp mount và bắn request 403.
  // Đường dẫn không có trong bảng (trang mới chưa khai báo) thì để qua, vì BE vẫn
  // là chốt chặn thật; guard này là lớp phòng vệ thứ hai, không phải lớp duy nhất.
  const allowedRoles = rolesForAdminPath(pathname);
  const forbidden = allowedRoles !== null && !allowedRoles.includes(user?.role ?? "");

  return (
    <AuthGuard roles={[...ALL_ADMIN_ROLES]}>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {/* F-30: mobile dùng drawer, desktop giữ sidebar cố định */}
        <ResponsiveSidebar>
          <AdminSidebar onLogout={handleLogout} />
        </ResponsiveSidebar>
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <AdminHeader onLogout={handleLogout} />
          {forbidden ? <AdminForbidden /> : children}
        </main>
      </div>
    </AuthGuard>
  );
}
