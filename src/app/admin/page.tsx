"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  DollarSign,
  Tag,
  Heart,
  BarChart3,
  FileText,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Download,
  Plus,
  CheckCircle,
  AlertTriangle,
  Info,
  LogOut,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { Button } from "@/shared/components/ui/button";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verification", label: "Verification", icon: BadgeCheck },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/vouchers", label: "Vouchers", icon: Tag },
  { href: "/admin/loyalty", label: "Loyalty", icon: Heart },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore();
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      <Link href="/" className="block px-5 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <p className="text-base font-bold text-[#0f172a] leading-tight">FitMatch</p>
        <p className="text-xs text-gray-400 mt-0.5">Admin Console</p>
      </Link>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {adminLinks.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-[#2563eb] text-white" : "text-gray-500 hover:text-[#0f172a] hover:bg-gray-50"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-8 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user?.fullName ?? user?.username ?? "A")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0f172a] truncate">{user?.fullName ?? user?.username ?? "Admin"}</p>
            <p className="text-xs text-gray-400 truncate">Senior Admin</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

const stats = [
  { label: "Total All Users", value: "24,512", delta: "+12.5%", up: true, icon: Users, color: "bg-blue-500" },
  { label: "Total PTs", value: "1,104", delta: "+8.1%", up: true, icon: BadgeCheck, color: "bg-purple-500" },
  { label: "Total Gyms", value: "482", delta: "-0.4%", up: false, icon: Heart, color: "bg-orange-500" },
  { label: "Monthly Revenue", value: "$142,890", delta: "+18.3%", up: true, icon: DollarSign, color: "bg-green-500" },
];

const barHeights = [40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const verificationQueue = [
  { name: "Marcus Thorne", role: "Senior IT Application", avatar: "MT" },
  { name: "Elena Rodriguez", role: "Network Administrator", avatar: "ER" },
  { name: "Ivan Horev Gym", role: "Fitness Center Manager", avatar: "IH" },
];

const withdrawalRequests = [
  { amount: "$1,249.90", trainer: "Alex Thompson" },
  { amount: "$893.50", trainer: "Sarah Wilson" },
];

const systemTimeline = [
  { icon: CheckCircle, color: "text-green-500", title: "Security Patch Deployed", time: "Just now · 2 mins ago", type: "success" },
  { icon: Info, color: "text-blue-500", title: "New Enterprise.Com Partnership", time: "24 Thì10 · 11:45 CH", type: "info" },
  { icon: AlertTriangle, color: "text-orange-500", title: "Payment Threshold Warning", time: "23 Thì10 · 09:20 SA", type: "warning" },
  { icon: AlertTriangle, color: "text-red-500", title: "Fraud Detection Alert", time: "21 Thì10 · 14:10 CH", type: "error" },
  { icon: CheckCircle, color: "text-green-500", title: "System Backup Complete", time: "20 Thì10 · 03:00 SA", type: "success" },
];

const linePoints = [20, 25, 22, 35, 30, 45, 40, 55, 48, 65, 58, 75];

function LineChart() {
  const max = Math.max(...linePoints);
  const h = 80;
  const w = 100;
  const pts = linePoints.map((v, i) => {
    const x = (i / (linePoints.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.5"
        points={pts.join(" ")}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function DashboardContent() {
  const { logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <AdminSidebar onLogout={handleLogout} />

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Console</span>
          <div className="flex items-center gap-3">
            <input
              className="pl-4 pr-4 h-8 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none w-44 placeholder:text-gray-400"
              placeholder="Global Search..."
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#191b23]">Executive Dashboard</h1>
              <p className="text-sm text-gray-400 mt-0.5">Snapshot of FitMatch performance for October 2023.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 h-9 text-sm">
                <Download className="size-3.5" /> Export Report
              </Button>
              <Link href="/admin/users">
                <Button className="gap-2 h-9 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                  <Plus className="size-3.5" /> New Promotion
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(({ label, value, delta, up, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`size-9 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="size-4 text-white" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-green-600" : "text-red-500"}`}>
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {delta}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#191b23]">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-5">
            {/* Growth Analytics */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#191b23]">Growth Analytics</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Tracking platform population density trends</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500 inline-block" /> Users</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-purple-400 inline-block" /> PTs</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-400 inline-block" /> Gyms</span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-[#2563eb]"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] text-gray-400">{months[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Queue */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#191b23]">Verification Queue</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">NEW</span>
              </div>
              <div className="space-y-3">
                {verificationQueue.map(({ name, role, avatar }) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#191b23] truncate">{name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{role}</p>
                    </div>
                    <ArrowUpRight className="size-3.5 text-gray-400 shrink-0" />
                  </div>
                ))}
              </div>
              <Link href="/admin/verification" className="block mt-4 text-xs text-[#2563eb] font-medium hover:underline">
                View All Applications
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Revenue Momentum */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="text-sm font-semibold text-[#191b23]">Revenue Momentum</h2>
                  <p className="text-[10px] text-gray-400">Real-time daily revenue for october</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#191b23]">$14,212.44</p>
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">ACTIVE TODAY</span>
                </div>
              </div>
              <LineChart />

              {/* Withdrawal Requests */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-[#191b23]">Withdrawal Requests</h3>
                  <button className="text-[10px] text-[#2563eb] font-medium hover:underline">View all</button>
                </div>
                <div className="space-y-2">
                  {withdrawalRequests.map(({ amount, trainer }) => (
                    <div key={trainer} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-[#191b23]">{amount}</p>
                        <p className="text-[10px] text-gray-400">{trainer}</p>
                      </div>
                      <button className="text-xs text-[#2563eb] font-medium border border-[#2563eb]/30 px-3 py-1 rounded-lg hover:bg-blue-50">
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#191b23]">System Timeline</h2>
                <button className="text-xs text-[#2563eb] font-medium hover:underline">View All</button>
              </div>
              <div className="space-y-3.5">
                {systemTimeline.map(({ icon: Icon, color, title, time }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className={`size-4 shrink-0 mt-0.5 ${color}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#191b23] leading-tight">{title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="size-3" />{time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">© 2023 FitMatch Enterprise Console. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Support Center</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard roles={["ROLE_ADMIN"]}>
      <DashboardContent />
    </AuthGuard>
  );
}
