"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard, Users, ShieldCheck, DollarSign, Tag,
  Heart, BarChart3, FileText, ClipboardList, LogOut,
  Search, Bell, ChevronDown, UserCircle, Database,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { AuthGuard } from "@/modules/auth/auth-guard";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/vouchers", label: "Vouchers", icon: Tag },
  { href: "/admin/loyalty", label: "Loyalty", icon: Heart },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/master-data", label: "Master Data", icon: Database },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
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
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen">
      <Link href="/" className="block px-5 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors shrink-0">
        <p className="text-base font-bold text-[#0f172a] leading-tight">FitMatch</p>
        <p className="text-xs text-gray-400 mt-0.5">Admin Console</p>
      </Link>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {adminLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-[#2563eb] text-white" : "text-gray-500 hover:text-[#0f172a] hover:bg-gray-50"
              }`}
            >
              <Icon className="size-4 shrink-0" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100 shrink-0">
        <button onClick={onLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors">
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
    <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
        <input className="pl-9 pr-4 h-8 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none w-56 placeholder:text-gray-400" placeholder="Tìm kiếm..." />
      </div>
      <div className="flex items-center gap-2">
        <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell className="size-4" />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-500" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 h-11 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{initial}</div>
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-[11px] text-gray-400">{role}</p>
            </div>
            <ChevronDown className="size-4 text-gray-400" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                <Link href="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <UserCircle className="size-4" /> Hồ sơ
                </Link>
                <Link href="/" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
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
    <AuthGuard roles={["ROLE_ADMIN"]}>
      <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
        <AdminSidebar onLogout={handleLogout} />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <AdminHeader onLogout={handleLogout} />
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
