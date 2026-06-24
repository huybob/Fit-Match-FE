"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { getHomeRouteForRole } from "@/modules/auth/auth-routing";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";
import { FieldShell } from "./form-controls";
import { changePasswordSchema, loginSchema, registerSchema } from "./schemas";

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-3 text-gray-400">{label}</span>
      </div>
    </div>
  );
}

export function LoginForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const user = await login(values);
      toast({ type: "success", title: t("auth.loginSuccess") });
      router.replace(getHomeRouteForRole(user.role));
    } catch (error) {
      toast({
        type: "error",
        title: t("common.error"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Chào mừng trở lại 👋</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Đăng nhập để tiếp tục hành trình của bạn
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Tài khoản</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="username"
              placeholder="Nhập tài khoản"
              className="pl-10"
              {...form.register("username")}
            />
          </div>
          {form.formState.errors.username && (
            <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              className="pl-10 pr-10"
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.loading") : "Đăng nhập"}
        </Button>
      </form>

      <AuthDivider label="HOẶC" />

      <Button variant="outline" className="w-full gap-2" type="button">
        <GoogleIcon />
        Tiếp tục với Google
      </Button>

      <p className="text-center text-sm text-gray-500">
        Bạn chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-[#2563EB] hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const registerAccount = useAuthStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "ROLE_CUSTOMER",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    if (values.password !== confirmPassword) {
      toast({ type: "error", title: "Mật khẩu xác nhận không khớp" });
      return;
    }
    if (!terms) {
      toast({ type: "warning", title: "Vui lòng đồng ý điều khoản sử dụng" });
      return;
    }
    try {
      const user = await registerAccount({
        ...values,
        phone: values.phone || undefined,
      });
      toast({ type: "success", title: t("auth.registerSuccess") });
      router.replace(getHomeRouteForRole(user.role));
    } catch (error) {
      toast({
        type: "error",
        title: t("common.error"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Tạo Tài Khoản 🚀</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Tham gia FitMatch để bắt đầu hành trình thể hình của bạn
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Họ và Tên</label>
          <Input
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <Input
              autoComplete="email"
              type="email"
              placeholder="you@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Điện thoại</label>
            <Input
              autoComplete="tel"
              placeholder="0901 234 567"
              {...form.register("phone")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              className="pr-10"
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu</label>
          <Input
            autoComplete="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 accent-[#2563EB]"
          />
          <span className="text-sm text-gray-600">
            Tôi đồng ý với{" "}
            <Link href="#" className="font-semibold text-[#2563EB] hover:underline">
              điều khoản
            </Link>{" "}
            và{" "}
            <Link href="#" className="font-semibold text-[#2563EB] hover:underline">
              chính sách bảo mật
            </Link>
          </span>
        </label>

        <Button
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.loading") : "Đăng ký →"}
        </Button>
      </form>

      <AuthDivider label="HOẶC ĐĂNG KÝ BẰNG" />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" className="gap-2">
          <GoogleIcon />
          Google
        </Button>
        <Button variant="outline" type="button" className="gap-2">
          <AppleIcon />
          Apple
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-[#2563EB] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof changePasswordSchema>) {
    try {
      await authService.changePassword(values);
      form.reset();
      toast({ type: "success", title: t("auth.passwordChanged") });
    } catch (error) {
      toast({
        type:
          getErrorCode(error) === "INVALID_CREDENTIALS" ? "warning" : "error",
        title: t("common.error"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldShell
        label={t("auth.currentPassword")}
        error={form.formState.errors.oldPassword}
      >
        <Input
          autoComplete="current-password"
          type="password"
          {...form.register("oldPassword")}
        />
      </FieldShell>
      <FieldShell
        label={t("auth.newPassword")}
        error={form.formState.errors.newPassword}
      >
        <Input
          autoComplete="new-password"
          type="password"
          {...form.register("newPassword")}
        />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
