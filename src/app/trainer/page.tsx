"use client";

import Link from "next/link";
import {
  CalendarCheck2, Bell, Search, TrendingUp, TrendingDown,
  Clock, Dumbbell, DollarSign, CheckCheck, Timer,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";

const stats = [
  {
    label: "Tổng đặt lịch",
    value: "42",
    delta: "+2.5%",
    sub: "so với tuần trước",
    up: true,
    icon: CalendarCheck2,
    iconBg: "bg-blue-500",
  },
  {
    label: "Buổi tập đã xong",
    value: "156",
    delta: "+1%",
    sub: "so với tuần trước",
    up: true,
    icon: Dumbbell,
    iconBg: "bg-green-500",
  },
  {
    label: "Doanh thu tháng này",
    value: "28.4M ₫",
    delta: "+10%",
    sub: "so với tháng trước",
    up: true,
    icon: DollarSign,
    iconBg: "bg-purple-500",
  },
  {
    label: "Đang chờ xử lý",
    value: "4.2M ₫",
    delta: "+5%",
    sub: "so với tuần trước",
    up: true,
    icon: Timer,
    iconBg: "bg-orange-500",
  },
];

const lineData = [18, 22, 19, 30, 26, 38, 34, 48, 42, 55, 50, 62, 58, 70];
const weekDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const upcoming = [
  { time: "09:45", title: "Tập Gym – Giảm cân", sub: "Thứ 2 · Giảm cân", color: "bg-blue-500", border: "border-l-blue-500" },
  { time: "10:15", title: "Yoga phục hồi", sub: "Thứ 3 · California Fitness", color: "bg-green-500", border: "border-l-green-500" },
  { time: "14:00", title: "Boxing cá nhân", sub: "Thứ 4", color: "bg-orange-500", border: "border-l-orange-500" },
];

const newBookings = [
  { name: "Nguyễn Thúy Linh", initials: "NL", service: "Personal Training 1:1", date: "Thứ 2, 11 Thg 10", price: "500,000 VND", avatarColor: "from-blue-400 to-blue-600" },
  { name: "Đặng Quốc Bảo", initials: "DB", service: "Tổng gym & khởi sức", date: "Thứ 3, 11 Thg 10", price: "450,000 VND", avatarColor: "from-green-400 to-green-600" },
];

function LineChart() {
  const max = Math.max(...lineData);
  const h = 90, w = 300;
  const pts = lineData.map((v, i) => `${(i / (lineData.length - 1)) * w},${h - (v / max) * (h - 10) - 5}`);
  const area = `M0,${h} ` + lineData.map((v, i) => `L${(i / (lineData.length - 1)) * w},${h - (v / max) * (h - 10) - 5}`).join(" ") + ` L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ptLineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ptLineGrad)" />
      <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts.join(" ")} vectorEffect="non-scaling-stroke" />
      {lineData.map((v, i) => {
        const x = (i / (lineData.length - 1)) * w;
        const y = h - (v / max) * (h - 10) - 5;
        return i === lineData.length - 1 ? (
          <circle key={i} cx={x} cy={y} r="4" fill="#2563eb" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        ) : null;
      })}
    </svg>
  );
}

export default function TrainerDashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(" ").pop() ?? user?.username ?? "Bạn";

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input className="pl-9 pr-4 h-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300 w-56 placeholder:text-gray-400" placeholder="Tìm kiếm khách hàng, lịch hẹn..." />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-500" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {(user?.fullName ?? user?.username ?? "T")[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">{user?.fullName ?? user?.username}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Welcome banner */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-[#0f172a]">Chào buổi sáng, {firstName}! 👋</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  <CheckCheck className="size-3" /> Đã xác minh
                </span>
                <span className="text-xs text-gray-400">4.8 ★ đánh giá · 156 buổi tập hoàn thành</span>
              </div>
            </div>
            <Link href="/trainer/bookings"
              className="flex items-center gap-2 h-9 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200">
              Chia sẻ lịch hẹn
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map(({ label, value, delta, sub, up, icon: Icon, iconBg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className={`size-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {delta}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-[#0f172a] mt-1">{value}</p>
                <p className="text-[13px] font-medium text-gray-600 mt-0.5">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chart + Upcoming */}
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-bold text-[#0f172a]">Xu hướng doanh thu</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Tuần hiện tại vs tuần trước</p>
                </div>
                <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none text-gray-600 bg-gray-50">
                  <option>7 ngày qua</option>
                  <option>30 ngày qua</option>
                </select>
              </div>
              <LineChart />
              <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-0.5">
                {weekDays.map(d => <span key={d}>{d}</span>)}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-[#0f172a]">Lịch sắp tới</h2>
                <Link href="/trainer/bookings" className="text-xs text-[#2563eb] font-semibold hover:underline">Xem tất cả</Link>
              </div>
              <div className="space-y-2.5">
                {upcoming.map(({ time, title, sub }) => (
                  <div key={time} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-center shrink-0">
                      <p className="text-[11px] font-bold text-[#2563eb]">{time}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#0f172a] truncate">{title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="size-3" />{sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking requests */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-bold text-[#0f172a]">Yêu cầu đặt lịch mới</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">3 phiếu mới</span>
              </div>
              <Link href="/trainer/bookings" className="text-xs text-[#2563eb] font-semibold hover:underline">Xem tất cả yêu cầu</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 text-left">Khách hàng</th>
                  <th className="pb-3 text-left">Dịch vụ</th>
                  <th className="pb-3 text-left">Thời gian mong muốn</th>
                  <th className="pb-3 text-left">Giá trị</th>
                  <th className="pb-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {newBookings.map(({ name, initials, service, date, price, avatarColor }) => (
                  <tr key={name} className="border-t border-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-[13px] font-semibold text-[#0f172a]">{name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[13px] text-gray-600">{service}</td>
                    <td className="py-3 text-[13px] text-gray-600">{date}</td>
                    <td className="py-3 text-[13px] font-bold text-[#0f172a]">{price}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-white font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-1.5 rounded-lg transition-colors">Chấp nhận</button>
                        <button className="text-xs text-gray-500 font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Từ chối</button>
                      </div>
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
