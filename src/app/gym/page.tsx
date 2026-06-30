"use client";

import Link from "next/link";
import {
  CalendarCheck2, DollarSign, WalletCards,
  Bell, Search, TrendingUp, TrendingDown, Plus,
  FileText, XCircle, Clock,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";

const stats = [
  {
    label: "Tổng doanh thu",
    value: "125.4M",
    delta: "+42.4%",
    sub: "so với tháng trước",
    up: true,
    icon: DollarSign,
    iconBg: "bg-green-500",
  },
  {
    label: "Đơn đặt lịch",
    value: "142",
    delta: "+46%",
    sub: "so với tuần trước",
    up: true,
    icon: CalendarCheck2,
    iconBg: "bg-blue-500",
  },
  {
    label: "Doanh thu tháng",
    value: "42.8M",
    delta: "+8.4%",
    sub: "so với tháng trước",
    up: true,
    icon: WalletCards,
    iconBg: "bg-purple-500",
  },
  {
    label: "Đã hủy",
    value: "18",
    delta: "-3%",
    sub: "so với tuần trước",
    up: false,
    icon: XCircle,
    iconBg: "bg-red-500",
  },
  {
    label: "Chờ thanh toán",
    value: "24.5M",
    delta: "+8%",
    sub: "so với tuần trước",
    up: true,
    icon: FileText,
    iconBg: "bg-orange-500",
  },
];

const barData = [35, 52, 44, 68, 58, 75, 62];
const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const branches = [
  { name: "Chi nhánh Quận 1", address: "123 Lê Lợi, Q.1, TP.HCM", pct: 86, status: "Đã xác minh", ok: true },
  { name: "Chi nhánh Thảo Điền", address: "45 Xuân Thủy, Q.2, TP.HCM", pct: 43, status: "Đang xem xét", ok: false },
];

const recentBookings = [
  { name: "Lê Minh Tuấn", initials: "LT", facility: "Phòng tập Gym", time: "Hôm nay, 10:30", status: "Đã xác nhận", ok: true, avatarColor: "from-blue-400 to-blue-600" },
  { name: "Nguyễn Thu Hà", initials: "NH", facility: "Bể bơi", time: "Hôm nay, 11:00", status: "Đã xác nhận", ok: true, avatarColor: "from-green-400 to-green-600" },
  { name: "Phạm Văn Hùng", initials: "PH", facility: "Phòng tập Gym", time: "Ngày mai, 09:00", status: "Chờ thanh toán", ok: false, avatarColor: "from-orange-400 to-orange-600" },
];

function BarChart() {
  const max = Math.max(...barData);
  return (
    <div className="flex items-end gap-2 h-28">
      {barData.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors cursor-pointer"
            style={{ height: `${(v / max) * 100}%` }}
          />
          <span className="text-[9px] text-gray-400">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function GymDashboardPage() {
  const { user } = useAuthStore();

  const displayName = user?.fullName ?? user?.username ?? "Gym";
  const initial = displayName[0]?.toUpperCase() ?? "G";

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300 w-56 placeholder:text-gray-400" placeholder="Tìm kiếm đặt lịch, chi nhánh..." />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-500" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initial}
              </div>
              <span className="text-sm font-semibold text-gray-700">{displayName}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Welcome banner */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-[#0f172a]">Chào mừng trở lại, {displayName}!</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                  Đã xác minh
                </span>
                <span className="text-xs text-gray-400">· Hoạt động: 2 chi nhánh</span>
              </div>
            </div>
            <Link href="/gym/bookings"
              className="flex items-center gap-2 h-9 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200">
              <Plus className="size-4" /> Tạo đặt lịch mới
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-5 gap-4">
            {stats.map(({ label, value, delta, sub, up, icon: Icon, iconBg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className={`size-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {delta}
                  </span>
                </div>
                <p className="text-xl font-extrabold text-[#0f172a]">{value}</p>
                <p className="text-[12px] font-medium text-gray-600 mt-0.5">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chart + Branch status */}
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Xu hướng đặt lịch (7 ngày)</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Doanh thu theo ngày trong tuần</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Đặt lịch</span>
              </div>
              <BarChart />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-[#0f172a]">Trạng thái chi nhánh</h2>
                <Link href="/gym/gyms" className="text-xs text-[#2563eb] font-semibold hover:underline">Xem tất cả</Link>
              </div>
              <div className="space-y-5">
                {branches.map(({ name, address, pct, status, ok }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-semibold text-[#0f172a] truncate">{name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">{address}</p>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${ok ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">{pct}% công suất</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-bold text-[#0f172a]">Đơn đặt lịch gần đây</h2>
                <span className="text-[10px] font-bold text-gray-400">{recentBookings.length} đơn</span>
              </div>
              <Link href="/gym/bookings" className="text-xs text-[#2563eb] font-semibold hover:underline">Xem tất cả →</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 text-left">Khách hàng</th>
                  <th className="pb-3 text-left">Cơ sở</th>
                  <th className="pb-3 text-left">Thời gian</th>
                  <th className="pb-3 text-left">Trạng thái</th>
                  <th className="pb-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(({ name, initials, facility, time, status, ok, avatarColor }) => (
                  <tr key={name} className="border-t border-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-[13px] font-semibold text-[#0f172a]">{name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[13px] text-gray-600">{facility}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 text-[13px] text-gray-600">
                        <Clock className="size-3 text-gray-400" />
                        {time}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        ok ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="text-xs text-[#2563eb] font-semibold border border-[#2563eb]/30 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </main>
  );
}
