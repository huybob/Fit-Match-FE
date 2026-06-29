"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Heart,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Phone,
  Save,
  Settings,
  Shield,
  Smartphone,
  User,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { useToast } from "@/lib/toast-provider";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự").max(100),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const sidebarLinks = [
  { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/profile/bookings", label: "Lịch đặt", icon: Calendar },
  { href: "/profile/sessions", label: "Yêu thích", icon: Heart },
  { href: "/profile", label: "Hồ sơ", icon: User },
  { href: "/change-password", label: "Bảo mật", icon: Shield, active: true },
];

const mockSessions = [
  { id: 1, device: "MacBook Pro 16\"", location: "San Francisco, USA • Chrome • IP: 192.168.1.1", icon: Monitor, current: true },
  { id: 2, device: "iPhone 15 Pro", location: "London, UK • Ứng dụng FitMatch • 2 giờ trước", icon: Smartphone, current: false },
  { id: 3, device: "Windows Desktop", location: "Berlin, Germany • Edge • Hôm qua, 14:20", icon: Monitor, current: false },
];

const mockLoginHistory = [
  { id: 1, status: "success", title: "Đăng nhập Thành công", detail: "Chrome trên macOS • SF, USA", time: "Hôm nay, 09:12 SA" },
  { id: 2, status: "fail", title: "Đăng nhập Thất bại", detail: "Safari trên iOS • IP Không xác định", time: "24 Th10, 11:45 CH" },
  { id: 3, status: "change", title: "Mật khẩu đã được thay đổi", detail: "Công Web FitMatch", time: "20 Th10, 08:30 SA" },
];

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="w-64 shrink-0 bg-[#f3f3fe] border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-2 h-fit sticky top-6">
      <div className="pb-4">
        <p className="text-2xl font-semibold text-[#004ac6] leading-tight">FitMatch<br />Workspace</p>
        <p className="text-sm font-medium text-[#505f76] mt-1">Quản lý hành trình thể hình</p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {sidebarLinks.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-[#2563eb] text-white" : "text-[#505f76] hover:bg-white/60"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 pb-4">
        <Button className="w-full bg-[#004ac6] hover:bg-[#003a9e] text-white text-sm font-medium rounded-lg h-9">
          Đặt buổi tập mới
        </Button>
      </div>
      <div className="border-t border-[#e2e8f0] pt-4 flex flex-col gap-1">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#505f76] hover:bg-white/60">
          <Settings className="size-4" /> Cài đặt
        </Link>
        <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#dc2626] hover:bg-red-50 w-full text-left">
          <LogOut className="size-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function SecurityScoreCard({ user }: { user: { emailVerified?: boolean } }) {
  const score = 82;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  const checks = [
    { ok: true, label: "2FA đã được bật" },
    { ok: user.emailVerified ?? false, label: "Email khôi phục đã xác minh" },
    { ok: false, label: "Thay đổi mật khẩu lần cuối: 6 tháng trước", warn: true },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#191b23] mb-5">Điểm Bảo mật</h2>
      <div className="flex flex-col items-center mb-5">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="66" textAnchor="middle" className="text-2xl font-bold" fill="#191b23" fontSize="22" fontWeight="700">{score}%</text>
          <text x="70" y="84" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="600">RẤT MẠNH</text>
        </svg>
      </div>
      <div className="space-y-2 mb-4">
        {checks.map(({ ok, label, warn }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            {ok ? (
              <CheckCircle className="size-3.5 text-green-500 shrink-0" />
            ) : warn ? (
              <AlertTriangle className="size-3.5 text-orange-400 shrink-0" />
            ) : (
              <XCircle className="size-3.5 text-gray-300 shrink-0" />
            )}
            <span className={ok ? "text-[#475569]" : warn ? "text-orange-600" : "text-gray-400"}>{label}</span>
          </div>
        ))}
      </div>
      <button className="w-full h-9 rounded-lg bg-[#dbeafe] text-[#2563eb] text-sm font-medium hover:bg-blue-200 transition-colors">
        Cải thiện Điểm số
      </button>
    </div>
  );
}

function PasswordField({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#475569]">{label}</label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          className="h-11 border-[#e2e8f0] rounded-lg text-base pr-10"
          {...inputProps}
        />
        <button
          type="button" tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ChangePasswordCard() {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setSuccess(false);
    try {
      await authService.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      form.reset();
      setSuccess(true);
      toast({ type: "success", title: "Đổi mật khẩu thành công!" });
    } catch (error) {
      toast({
        type: getErrorCode(error) === "INVALID_CREDENTIALS" ? "warning" : "error",
        title: "Thất bại",
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="size-4 text-gray-600" />
        <h2 className="text-xl font-semibold text-[#191b23]">Đổi Mật khẩu</h2>
      </div>
      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#16a34a]">
          <CheckCircle className="size-4 shrink-0" /> Mật khẩu đã được cập nhật thành công.
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          label="Mật khẩu Hiện tại"
          autoComplete="current-password"
          error={form.formState.errors.oldPassword?.message}
          {...form.register("oldPassword")}
        />
        <div className="grid grid-cols-2 gap-4">
          <PasswordField
            label="Mật khẩu Mới"
            autoComplete="new-password"
            error={form.formState.errors.newPassword?.message}
            {...form.register("newPassword")}
          />
          <PasswordField
            label="Xác nhận Mật khẩu Mới"
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register("confirmPassword")}
          />
        </div>
        <p className="text-xs text-orange-500">Mật khẩu phải có ít nhất 12 ký tự và bao gồm sự kết hợp từ các ký hiệu, số và chữ hoa.</p>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-[#004ac6] hover:bg-[#003a9e] text-white h-10 px-6 rounded-lg gap-2"
          >
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Cập nhật Mật khẩu
          </Button>
        </div>
      </form>
    </div>
  );
}

function ActiveSessionsCard() {
  const { toast } = useToast();
  function logoutAll() {
    toast({ type: "info", title: "Đăng xuất tất cả thiết bị", description: "Tính năng sẽ được hỗ trợ sớm." });
  }
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#191b23]">Các Phiên Hoạt động</h2>
        <button onClick={logoutAll} className="text-xs text-[#2563eb] font-medium hover:underline">
          Đăng xuất khỏi tất cả các thiết bị khác
        </button>
      </div>
      <div className="space-y-4">
        {mockSessions.map(({ id, device, location, icon: DevIcon, current }) => (
          <div key={id} className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <DevIcon className="size-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#191b23]">{device}</p>
                {current && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">HIỆN TẠI</span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{location}</p>
            </div>
            {!current && (
              <button className="text-xs text-red-500 font-medium hover:underline shrink-0">Đăng xuất</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginHistoryCard() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#191b23] mb-5">Lịch sử Đăng nhập</h2>
      <div className="space-y-4">
        {mockLoginHistory.map(({ id, status, title, detail, time }) => (
          <div key={id} className="flex items-start gap-3">
            <div className={`size-2 rounded-full mt-1.5 shrink-0 ${
              status === "success" ? "bg-green-500" : status === "fail" ? "bg-red-500" : "bg-blue-500"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191b23]">{title}</p>
              <p className="text-xs text-gray-400">{detail}</p>
            </div>
            <p className="text-[10px] text-gray-400 shrink-0 text-right leading-tight">{time.split(",")[0]}<br />{time.split(",")[1]}</p>
          </div>
        ))}
      </div>
      <button className="mt-4 text-xs text-[#2563eb] font-medium hover:underline">Xem Toàn bộ Nhật ký Hoạt động</button>
    </div>
  );
}

function DangerZoneCard() {
  const { toast } = useToast();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDisable() {
    if (!password) return;
    setLoading(true);
    try {
      await authService.deactivateAccount(password);
      toast({ type: "success", title: "Tài khoản đã được vô hiệu hóa" });
      await logout();
      router.replace("/login");
    } catch (error) {
      toast({ type: "error", title: "Thất bại", description: toErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="size-5 text-red-500 mt-0.5 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-[#191b23]">Vùng Nguy hiểm</h2>
          <p className="text-sm text-[#64748b] leading-6 mt-1 max-w-2xl">
            Những hành động này không thể hoàn tác. Khi bạn vô hiệu hóa hoặc xóa tài khoản, dữ liệu của bạn (bao gồm lịch sử tập luyện và các gói thành viên đã thanh toán) sẽ bị lưu trữ vĩnh viễn hoặc bị xóa bỏ.
          </p>
        </div>
      </div>

      {!confirming ? (
        <div className="flex items-center gap-3 mt-5">
          <Button
            onClick={() => setConfirming(true)}
            className="h-10 border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 px-5 font-medium shadow-none"
          >
            Vô hiệu hóa Tài khoản
          </Button>
          <Button
            onClick={() => toast({ type: "warning", title: "Tính năng đang phát triển" })}
            className="h-10 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-5 font-medium shadow-none"
          >
            Xóa Vĩnh viễn
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3 rounded-xl bg-red-50 border border-red-200 p-4 max-w-md">
          <p className="text-sm font-medium text-red-700">Nhập mật khẩu để xác nhận vô hiệu hóa tài khoản:</p>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu của bạn"
              className="h-10 border-red-200 rounded-lg text-sm pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDisable}
              disabled={!password || loading}
              className="h-9 bg-red-600 hover:bg-red-700 text-white px-4 text-sm gap-1.5"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />} Xác nhận vô hiệu hóa
            </Button>
            <Button
              onClick={() => { setConfirming(false); setPassword(""); }}
              className="h-9 border border-[#e2e8f0] bg-white text-[#475569] hover:bg-gray-50 px-4 text-sm shadow-none"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityContent() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex gap-6 px-20 py-6">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Header */}
          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-[#191b23]">FitMatch</h1>
            <p className="text-sm text-[#64748b] mt-1">Quản lý bảo mật tài khoản, các phiên hoạt động và lịch sử đăng nhập của bạn.</p>
          </section>

          {/* Top row: Security score + Change password */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-4">
              <SecurityScoreCard user={user ?? {}} />
            </div>
            <div className="col-span-8">
              <ChangePasswordCard />
            </div>
          </div>

          {/* Middle row: Sessions + Login history */}
          <div className="grid grid-cols-2 gap-5">
            <ActiveSessionsCard />
            <LoginHistoryCard />
          </div>

          {/* Danger zone */}
          <DangerZoneCard />
        </main>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <AuthGuard roles={["ROLE_CUSTOMER", "ROLE_PT", "ROLE_GYM_OPERATOR"]}>
      <SecurityContent />
    </AuthGuard>
  );
}
