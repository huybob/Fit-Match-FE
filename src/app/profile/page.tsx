"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Heart,
  User,
  Shield,
  Settings,
  LogOut,
  Camera,
  Activity,
  AlertCircle,
  CheckCircle,
  Star,
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { AuthUser } from "@/services/auth.service";

const sidebarLinks = [
  { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/profile/bookings", label: "Lịch đặt", icon: Calendar },
  { href: "/profile/sessions", label: "Yêu thích", icon: Heart },
  { href: "/profile", label: "Hồ sơ", icon: User, active: true },
  { href: "/change-password", label: "Bảo mật", icon: Shield },
];

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="w-64 shrink-0 bg-[#f3f3fe] border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-2 h-fit sticky top-6">
      <div className="pb-4">
        <p className="text-2xl font-semibold text-[#004ac6] leading-tight">
          FitMatch<br />Workspace
        </p>
        <p className="text-sm font-medium text-[#505f76] mt-1">Quản lý hành trình thể hình</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {sidebarLinks.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-[#2563eb] text-white"
                : "text-[#505f76] hover:bg-white/60"
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
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#505f76] hover:bg-white/60"
        >
          <Settings className="size-4" />
          Cài đặt
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#dc2626] hover:bg-red-50 w-full text-left"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function ProfileHeader({ user }: { user: AuthUser }) {
  const initials = user.username
    ? user.username
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? "")
        .join("")
    : "U";

  return (
    <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <div className="flex gap-6 items-start">
        <div className="relative shrink-0">
          <div className="size-32 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
          <button className="absolute bottom-1 right-1 bg-[#004ac6] rounded-full p-2 shadow-md hover:bg-[#003a9e] transition-colors">
            <Camera className="size-3.5 text-white" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 truncate">{user.username}</h1>
          <p className="text-sm text-[#475569] mt-1">
            Thành viên từ{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] text-xs font-medium">
                <CheckCircle className="size-3" />
                Đã xác thực Email
              </span>
            ) : (
              <Link
                href="/resend-verification"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium hover:bg-yellow-100"
              >
                <AlertCircle className="size-3" />
                Chưa xác thực email
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbeafe] text-[#004ac6] text-xs font-medium">
              <Star className="size-3" />
              Hạng Elite
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalInfoCard({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await authService.updateProfile({
        email: email || undefined,
        phone: phone || undefined,
      });
      toast({ type: "success", title: "Cập nhật thông tin thành công!" });
    } catch (error) {
      toast({ type: "error", title: "Cập nhật thất bại", description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <User className="size-4 text-gray-600" />
        <h2 className="text-2xl font-semibold text-[#191b23]">Thông tin cá nhân</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Họ và tên</label>
          <Input
            value={user.username ?? ""}
            readOnly
            className="h-11 border-[#e2e8f0] rounded-lg bg-gray-50 text-base text-[#191b23]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Địa chỉ Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-[#e2e8f0] rounded-lg text-base text-[#191b23]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Số điện thoại</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 border-[#e2e8f0] rounded-lg text-base text-[#191b23]"
            placeholder="0901 234 567"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Vai trò</label>
          <Input
            value={
              {
                ROLE_CUSTOMER: "Khách hàng",
                ROLE_PT: "Huấn luyện viên",
                ROLE_GYM_OPERATOR: "Quản lý phòng gym",
                ROLE_ADMIN: "Quản trị viên",
              }[user.role ?? "ROLE_CUSTOMER"] ?? user.role
            }
            readOnly
            className="h-11 border-[#e2e8f0] rounded-lg bg-gray-50 text-base text-[#191b23]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Giới tính</label>
          <select className="w-full h-11 border border-[#e2e8f0] rounded-lg px-3 text-base text-[#191b23] bg-white">
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Địa điểm</label>
          <Input
            placeholder="TP. Hồ Chí Minh"
            className="h-11 border-[#e2e8f0] rounded-lg text-base text-[#191b23]"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#004ac6] hover:bg-[#003a9e] text-white h-10 px-6 rounded-lg gap-2"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}

function FitnessMetricsCard() {
  return (
    <div className="bg-[#004ac6] rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="size-5 text-white" />
        <h2 className="text-lg font-semibold text-white">Chỉ số thể hình</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-lg px-3 py-3">
          <p className="text-xs font-medium text-white/70">Chiều cao</p>
          <p className="text-xl font-normal text-white mt-0.5">— cm</p>
        </div>
        <div className="bg-white/10 rounded-lg px-3 py-3">
          <p className="text-xs font-medium text-white/70">Cân nặng</p>
          <p className="text-xl font-normal text-white mt-0.5">— kg</p>
        </div>
        <div className="col-span-2 bg-white/10 rounded-lg px-3 py-3">
          <p className="text-xs font-medium text-white/70">Mục tiêu chính</p>
          <p className="text-sm font-medium text-white mt-1">Phát triển cơ bắp</p>
        </div>
      </div>
    </div>
  );
}

function EmergencyContactCard() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <AlertCircle className="size-4 text-amber-500" />
        <h2 className="text-lg font-semibold text-[#191b23]">Liên hệ khẩn cấp</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Tên người liên hệ</label>
          <Input
            placeholder="Nguyễn Văn B"
            className="h-11 border-[#e2e8f0] rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Mối quan hệ</label>
          <Input
            placeholder="Vợ/Chồng"
            className="h-11 border-[#e2e8f0] rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#475569]">Số điện thoại</label>
          <Input
            placeholder="0901 234 567"
            className="h-11 border-[#e2e8f0] rounded-lg text-base"
          />
        </div>
      </div>
    </div>
  );
}

function FitnessPreferencesCard() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="size-4 text-gray-600" />
        <h2 className="text-2xl font-semibold text-[#191b23]">Sở thích tập luyện</h2>
      </div>
      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Phong cách yêu thích</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-[#dbeafe] text-[#004ac6] text-xs font-medium">
              HIIT
            </span>
            <span className="px-3 py-1 rounded-full bg-[#dbeafe] text-[#004ac6] text-xs font-medium">
              Cử tạ
            </span>
            <button className="px-3 py-1 rounded-full border border-[#004ac6] text-[#004ac6] text-xs font-medium hover:bg-blue-50">
              + Thêm
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Tần suất</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="freq" defaultChecked className="accent-[#004ac6]" />
              <span className="text-sm text-[#191b23]">4-5 ngày/tuần</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="freq" className="accent-[#004ac6]" />
              <span className="text-sm text-[#191b23]">Hàng ngày</span>
            </label>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Tiếp cận thiết bị</p>
          <select className="w-full h-11 border border-[#e2e8f0] rounded-lg px-3 text-base text-[#191b23] bg-white">
            <option>Phòng Gym chuyên nghiệp</option>
            <option>Tại nhà</option>
            <option>Ngoài trời</option>
          </select>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Chấn thương/Lưu ý</p>
          <textarea
            placeholder={"Ví dụ: Đau lưng nhẹ,\ndị ứng hạt..."}
            className="w-full h-24 border border-[#e2e8f0] rounded-lg p-3 text-base text-[#6b7280] resize-none focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
          />
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex gap-6 px-20 py-6">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <ProfileHeader user={user} />

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <PersonalInfoCard user={user} />
            </div>
            <div className="col-span-4 flex flex-col gap-6">
              <FitnessMetricsCard />
              <EmergencyContactCard />
            </div>
          </div>

          <FitnessPreferencesCard />
        </main>
      </div>
    </div>
  );
}
