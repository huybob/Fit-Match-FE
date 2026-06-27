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
  Save,
  Settings,
  Shield,
  User,
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

const changePasswordWithConfirmSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự").max(100),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordWithConfirmSchema>;

const sidebarLinks = [
  { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/profile/bookings", label: "Lịch đặt", icon: Calendar },
  { href: "/profile/sessions", label: "Yêu thích", icon: Heart },
  { href: "/profile", label: "Hồ sơ", icon: User },
  { href: "/change-password", label: "Bảo mật", icon: Shield, active: true },
];

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="w-64 shrink-0 bg-[#f3f3fe] border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-2 h-fit sticky top-6">
      <div className="pb-4">
        <p className="text-2xl font-semibold text-[#004ac6] leading-tight">
          FitMatch
          <br />
          Workspace
        </p>
        <p className="text-sm font-medium text-[#505f76] mt-1">
          Quản lý hành trình thể hình
        </p>
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

function PasswordField({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
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
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors"
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
    resolver: zodResolver(changePasswordWithConfirmSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setSuccess(false);
    try {
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
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
        <h2 className="text-2xl font-semibold text-[#191b23]">Đổi mật khẩu</h2>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#16a34a]">
          <CheckCircle className="size-4 shrink-0" />
          Mật khẩu đã được cập nhật thành công.
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <PasswordField
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          error={form.formState.errors.oldPassword?.message}
          {...form.register("oldPassword")}
        />

        <div className="grid grid-cols-2 gap-4">
          <PasswordField
            label="Mật khẩu mới"
            autoComplete="new-password"
            error={form.formState.errors.newPassword?.message}
            {...form.register("newPassword")}
          />
          <PasswordField
            label="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register("confirmPassword")}
          />
        </div>

        <div className="pt-1 flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-[#004ac6] hover:bg-[#003a9e] text-white h-10 px-6 rounded-lg gap-2"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </div>
  );
}

function DisableAccountCard() {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDisable() {
    setLoading(true);
    try {
      toast({
        type: "warning",
        title: "Tính năng đang phát triển",
        description: "Vô hiệu hóa tài khoản sẽ được hỗ trợ sớm.",
      });
    } finally {
      setLoading(false);
      setConfirming(false);
      setConfirmText("");
    }
  }

  return (
    <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-4 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[#191b23]">
          Vô hiệu hóa tài khoản
        </h2>
      </div>

      <p className="text-sm text-[#64748b] leading-6 max-w-xl">
        Khi vô hiệu hóa, tài khoản sẽ bị tạm dừng và bạn không thể đăng nhập
        cho đến khi liên hệ bộ phận hỗ trợ để kích hoạt lại. Toàn bộ dữ liệu
        lịch đặt và hồ sơ sẽ được giữ nguyên.
      </p>

      {!confirming ? (
        <Button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 h-10 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 px-5 font-medium shadow-none"
        >
          Vô hiệu hóa tài khoản
        </Button>
      ) : (
        <div className="mt-5 space-y-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-700">
            Nhập{" "}
            <span className="font-bold font-mono tracking-wide">
              VÔ HIỆU HÓA
            </span>{" "}
            để xác nhận:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="VÔ HIỆU HÓA"
            className="h-10 border-red-200 rounded-lg text-sm focus-visible:ring-red-300"
          />
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={handleDisable}
              disabled={confirmText !== "VÔ HIỆU HÓA" || loading}
              className="h-9 bg-red-600 hover:bg-red-700 text-white px-4 text-sm font-medium disabled:opacity-40 gap-1.5"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Xác nhận vô hiệu hóa
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirming(false);
                setConfirmText("");
              }}
              className="h-9 border border-[#e2e8f0] bg-white text-[#475569] hover:bg-gray-50 px-4 text-sm font-medium shadow-none"
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
  const { logout } = useAuthStore();
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
          {/* Page header */}
          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#dbeafe]">
                <Shield className="size-5 text-[#2563eb]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#191b23]">
                  Bảo mật tài khoản
                </h1>
                <p className="text-sm text-[#64748b] mt-0.5">
                  Quản lý mật khẩu và cài đặt bảo mật của bạn
                </p>
              </div>
            </div>
          </section>

          <ChangePasswordCard />
          <DisableAccountCard />
        </main>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <AuthGuard roles={["ROLE_CUSTOMER"]}>
      <SecurityContent />
    </AuthGuard>
  );
}
