"use client";

import Link from "next/link";
import {
  LayoutDashboard, ShieldCheck, BriefcaseBusiness, Package,
  CalendarDays, CalendarCheck2, Banknote, WalletCards, Settings,
  Bell, Search, TrendingUp, TrendingDown, LogOut, ChevronRight, Clock, User,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useRouter } from "next/navigation";

const ptLinks = [
  { href: "/trainer", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/trainer/verification", label: "Xác minh", icon: ShieldCheck },
  { href: "/trainer/services", label: "Dịch vụ", icon: BriefcaseBusiness },
  { href: "/trainer/packages", label: "Gói tập", icon: Package },
  { href: "/trainer/availability", label: "Lịch", icon: CalendarDays },
  { href: "/trainer/bookings", label: "Đặt lịch", icon: CalendarCheck2 },
  { href: "/trainer/payments", label: "Doanh thu", icon: WalletCards },
  { href: "/trainer/withdrawals", label: "Rút tiền", icon: Banknote },
  { href: "/trainer/profile", label: "Cài đặt", icon: Settings },
];

const stats = [
  { label: "Tổng đặt lịch", value: "42", delta: "+2.5%", up: true, color: "bg-blue-500" },
  { label: "Buổi tập xong", value: "156", delta: "+1%", up: true, color: "bg-green-500" },
  { label: "Doanh thu tháng", value: "28.4M", delta: "+10%", up: true, color: "bg-purple-500" },
  { label: "Đang chờ xử lý", value: "4.2M", delta: "+5%", up: true, color: "bg-orange-500" },
];

const lineData = [18, 22, 19, 30, 26, 38, 34, 48, 42, 55, 50, 62, 58, 70];

const upcoming = [
  { time: "09:45", title: "Tập Gym – Giảm cân", sub: "Thứ 2 · Giảm cân", color: "bg-blue-500" },
  { time: "10:15", title: "Yoga phục hồi", sub: "Thứ 3 · California Fitness", color: "bg-green-500" },
  { time: "14:00", title: "Boxing cá nhân", sub: "Thứ 4", color: "bg-orange-500" },
];

const newBookings = [
  { name: "Nguyễn Thúy Linh", service: "Personal Training 1:1", date: "Thứ 2, 11 Thg 10", price: "500,000 VND" },
  { name: "Đặng Quốc Bảo", service: "Tổng gym & khởi sức", date: "Thứ 3, 11 Thg 10", price: "450,000 VND" },
];

function LineChart() {
  const max = Math.max(...lineData);
  const h = 80, w = 260;
  const pts = lineData.map((v, i) => `${(i / (lineData.length - 1)) * w},${h - (v / max) * h}`);
  const area = `M0,${h} ` + lineData.map((v, i) => `L${(i / (lineData.length - 1)) * w},${h - (v / max) * h}`).join(" ") + ` L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ptGrad)" />
      <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={pts.join(" ")} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function TrainerDashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const firstName = user?.fullName?.split(" ").pop() ?? user?.username ?? "Bạn";

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
          <p className="text-xs text-white/50 mt-0.5">Trainer Hub</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {ptLinks.map(({ href, label, icon: Icon, active }) => (
            <Link key={href} href={href}
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
              {(user?.fullName ?? user?.username ?? "T")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName ?? user?.username}</p>
              <p className="text-xs text-white/40 truncate">Professional PT</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors">
            <LogOut className="size-3.5" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input className="pl-9 pr-4 h-8 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none w-52 placeholder:text-gray-400" placeholder="Tìm kiếm khách hàng, lịch hẹn..." />
          </div>
          <div className="flex items-center gap-3">
            <button className="size-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
              <Bell className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white">
                {(user?.fullName ?? user?.username ?? "T")[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.fullName ?? user?.username}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Welcome */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#191b23] mb-1">Chào buổi sáng, {firstName}! 👋</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-green-500 inline-block" />
                Đã xác minh · 4.8 ★ đánh giá
              </span>
            </div>
            <Link href="/trainer/bookings"
              className="flex items-center gap-2 h-9 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg transition-colors">
              Chia sẻ lịch hẹn <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(({ label, value, delta, up, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`size-2 rounded-full ${color}`} />
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{delta}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#191b23]">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-5">
            {/* Revenue chart */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#191b23]">Xu hướng doanh thu</h2>
                  <p className="text-xs text-gray-400 mt-0.5">7 ngày qua</p>
                </div>
                <span className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">7 ngày qua</span>
              </div>
              <LineChart />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-1">
                {["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"].map(d => <span key={d}>{d}</span>)}
              </div>
            </div>

            {/* Upcoming schedule */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#191b23]">Lịch sắp tới</h2>
                <Link href="/trainer/bookings" className="text-xs text-[#2563eb] font-medium hover:underline">Xem tất cả</Link>
              </div>
              <div className="space-y-3">
                {upcoming.map(({ time, title, sub, color }) => (
                  <div key={time} className="flex items-start gap-3">
                    <div className={`mt-1 size-2 rounded-full shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#191b23] truncate">{title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="size-3" />{time} · {sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking requests */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#191b23]">Yêu cầu đặt lịch mới</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">3 phiếu mới</span>
              </div>
              <Link href="/trainer/bookings" className="text-xs text-[#2563eb] font-medium hover:underline">Xem tất cả yêu cầu</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 text-left">Khách hàng</th>
                  <th className="pb-2 text-left">Dịch vụ</th>
                  <th className="pb-2 text-left">Thời gian</th>
                  <th className="pb-2 text-left">Giá trị</th>
                  <th className="pb-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {newBookings.map(({ name, service, date, price }) => (
                  <tr key={name}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="size-3.5 text-gray-400" />
                        </div>
                        <span className="font-medium text-[#191b23] text-xs">{name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-600">{service}</td>
                    <td className="py-3 text-xs text-gray-600">{date}</td>
                    <td className="py-3 text-xs font-semibold text-[#191b23]">{price}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-[#2563eb] font-medium border border-[#2563eb]/30 px-2.5 py-1 rounded-lg hover:bg-blue-50">Chấp nhận</button>
                        <button className="text-xs text-gray-500 font-medium border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50">Từ chối</button>
                      </div>
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
