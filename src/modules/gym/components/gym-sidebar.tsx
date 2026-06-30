"use client";

import Link from "next/link";
import {
  LayoutDashboard, ShieldCheck, Building2, GitBranch,
  CalendarCheck2, DollarSign, Banknote, Settings, LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";

const gymLinks = [
  { href: "/gym", label: "Bảng điều hành", icon: LayoutDashboard },
  { href: "/gym/verification", label: "Xác minh", icon: ShieldCheck },
  { href: "/gym/gyms", label: "Cơ sở", icon: Building2 },
  { href: "/gym/branches", label: "Chi nhánh", icon: GitBranch },
  { href: "/gym/bookings", label: "Đặt lịch", icon: CalendarCheck2 },
  { href: "/gym/revenue", label: "Doanh thu", icon: DollarSign },
  { href: "/gym/withdrawals", label: "Rút tiền", icon: Banknote },
  { href: "/gym/settings", label: "Cài đặt", icon: Settings },
];

export function GymSidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const displayName = user?.fullName ?? user?.username ?? "Gym";
  const initial = displayName[0]?.toUpperCase() ?? "G";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#2563eb] flex items-center justify-center shrink-0">
            <Building2 className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a] leading-tight">FitMatch</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Gym Operator Workspace</p>
          </div>
        </div>
      </div>

      {/* User info — top below brand */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0f172a] truncate">{displayName}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Gym Operator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {gymLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/gym" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#2563eb] text-white"
                  : "text-gray-500 hover:text-[#0f172a] hover:bg-gray-50"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
