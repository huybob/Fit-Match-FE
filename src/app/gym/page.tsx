"use client";

import Link from "next/link";
import {
  LayoutDashboard, ShieldCheck, Building2, GitBranch,
  CalendarCheck2, DollarSign, Banknote,
  Bell, Search, TrendingUp, TrendingDown, LogOut, Plus,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useRouter } from "next/navigation";

const gymLinks = [
  { href: "/gym", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/gym/verification", label: "Xác minh", icon: ShieldCheck },
  { href: "/gym/gyms", label: "Cơ sở", icon: Building2 },
  { href: "/gym/gyms", label: "Chi nhánh", icon: GitBranch },
  { href: "/gym/bookings", label: "Đặt lịch", icon: CalendarCheck2 },
  { href: "/gym/revenue", label: "Doanh thu", icon: DollarSign },
  { href: "/gym/withdrawals", label: "Rút tiền", icon: Banknote },
];

const stats = [
  { label: "Tiền tệ", value: "12", delta: "-45%", up: false, color: "bg-red-500" },
  { label: "Đơn đặt lịch", value: "142", delta: "+46%", up: true, color: "bg-blue-500" },
  { label: "Doanh thu tháng", value: "125.4M", delta: "+42.4%", up: true, color: "bg-green-500" },
  { label: "Đã hủy", value: "18", delta: "-3%", up: false, color: "bg-orange-500" },
  { label: "Chờ thanh toán", value: "24.5M", delta: "+8%", up: true, color: "bg-purple-500" },
];

const barData = [35, 52, 44, 68, 58, 75, 62];
const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const branches = [
  { name: "Chi nhánh Quận 1", address: "123 Lê Lợi, Q.1, TP.HCM", pct: 86, status: "Đã xác minh", ok: true },
  { name: "Chi nhánh Thảo Điền", address: "45 Xuân Thủy, Q.2, TP.HCM", pct: 43, status: "Đang xem xét", ok: false },
];

const recentBookings = [
  { name: "Lê Minh Tuấn", facility: "Phòng tập Gym", time: "Hôm nay, 10:30", status: "Đã xác nhận", ok: true },
  { name: "Nguyễn Thu Hà", facility: "Bể bơi", time: "Hôm nay, 11:00", status: "Đã xác nhận", ok: true },
  { name: "Phạm Văn Hùng", facility: "Phòng tập Gym", time: "Ngày mai, 09:00", status: "Chờ thanh toán", ok: false },
];

export default function GymDashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const gymName = user?.fullName ?? user?.username ?? "Phòng gym";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#1a1f37] flex flex-col min-h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-base font-bold text-white leading-tight">FitMatch</p>
          <p className="text-xs text-white/50 mt-0.5">Gym Operator Workspace</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {gymLinks.map(({ href, label, icon: Icon, active }) => (
            <Link key={label} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-[#2563eb] text-white" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="size-4 shrink-0" />{label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {(user?.fullName ?? user?.username ?? "G")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-white/40 truncate">Gym Operator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors">
            <LogOut className="size-3.5" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input className="pl-9 pr-4 h-8 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none w-52 placeholder:text-gray-400" placeholder="Tìm kiếm..." />
          </div>
          <div className="flex items-center gap-3">
            <button className="size-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
              <Bell className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white">
                {(user?.fullName ?? user?.username ?? "G")[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Welcome */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#191b23] mb-1">Chào mừng trở lại, {gymName}!</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                  <span className="size-1.5 rounded-full bg-green-500 inline-block" />
                  Đã xác minh
                </span>
                <span className="text-xs text-gray-400">· Hoạt động: 2 chi nhánh</span>
              </div>
            </div>
            <Link href="/gym/bookings"
              className="flex items-center gap-2 h-9 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg transition-colors">
              <Plus className="size-4" /> Tạo Đặt Lịch Mới
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {stats.map(({ label, value, delta, up, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`size-2 rounded-full ${color}`} />
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{delta}
                  </span>
                </div>
                <p className="text-xl font-bold text-[#191b23]">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-5">
            {/* Revenue chart */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#191b23]">Xu hướng doanh thu (7 ngày)</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Doanh thu theo ngày trong tuần</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">● Đặt lịch</span>
              </div>
              <div className="flex items-end gap-2 h-28">
                {barData.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-[#2563eb]" style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-gray-400">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Branch status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#191b23]">Trạng thái chi nhánh</h2>
                <Link href="/gym/gyms" className="text-xs text-[#2563eb] font-medium hover:underline">Xem tất cả</Link>
              </div>
              <div className="space-y-4">
                {branches.map(({ name, address, pct, status, ok }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[#191b23] truncate">{name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1.5">{address}</p>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ok ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent bookings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#191b23]">Đơn đặt lịch gần đây</h2>
              <Link href="/gym/bookings" className="text-xs text-[#2563eb] font-medium hover:underline">Xem tất cả →</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 text-left">Tên khách</th>
                  <th className="pb-2 text-left">Cơ sở</th>
                  <th className="pb-2 text-left">Thời gian</th>
                  <th className="pb-2 text-left">Trạng thái</th>
                  <th className="pb-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map(({ name, facility, time, status, ok }) => (
                  <tr key={name}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {name[0]}
                        </div>
                        <span className="font-medium text-[#191b23] text-xs">{name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-600">{facility}</td>
                    <td className="py-3 text-xs text-gray-600">{time}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="text-xs text-[#2563eb] font-medium border border-[#2563eb]/30 px-2.5 py-1 rounded-lg hover:bg-blue-50">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
