"use client";

import Link from "next/link";
import {
  LayoutDashboard, ShieldCheck, BriefcaseBusiness, Package,
  CalendarDays, CalendarCheck2, Banknote, WalletCards, Settings,
  LogOut, Plus, Dumbbell,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";

const ptLinks = [
  { href: "/trainer", label: "Bảng điều hành", icon: LayoutDashboard },
  { href: "/trainer/verification", label: "Xác minh", icon: ShieldCheck },
  { href: "/trainer/services", label: "Dịch vụ", icon: BriefcaseBusiness },
  { href: "/trainer/packages", label: "Gói tập", icon: Package },
  { href: "/trainer/availability", label: "Lịch", icon: CalendarDays },
  { href: "/trainer/bookings", label: "Đặt lịch", icon: CalendarCheck2 },
  { href: "/trainer/payments", label: "Doanh thu", icon: WalletCards },
  { href: "/trainer/withdrawals", label: "Rút tiền", icon: Banknote },
  { href: "/trainer/profile", label: "Cài đặt", icon: Settings },
];

export function TrainerSidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Brand — click to go back home */}
      <Link href="/" className="block px-5 pt-6 pb-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#2563eb] flex items-center justify-center shrink-0">
            <Dumbbell className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a] leading-tight">FitMatch</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Trainer Hub</p>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {ptLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/trainer" && pathname.startsWith(href));
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

      {/* CTA + User info */}
      <div className="px-4 py-4 border-t border-gray-100">
        <Link href="/trainer/bookings"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors mb-4">
          <Plus className="size-3.5" /> Tạo buổi tập mới
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user?.fullName ?? user?.username ?? "T")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0f172a] truncate">{user?.fullName ?? user?.username}</p>
            <p className="text-[10px] text-gray-400">Professional PT</p>
          </div>
          <button onClick={handleLogout} title="Đăng xuất" className="text-gray-400 hover:text-gray-700 transition-colors">
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
