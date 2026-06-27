"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
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
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "./schemas";

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
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-3 text-gray-400 tracking-widest">{label}</span>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

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
      const code = getErrorCode(error);
      if (code === "EMAIL_NOT_VERIFIED") {
        toast({
          type: "warning",
          title: "Email chưa được xác thực",
          description: "Vui lòng kiểm tra email để xác thực tài khoản.",
        });
        router.push("/resend-verification");
        return;
      }
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
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Chào mừng trở lại</h1>
        <p className="mt-2 text-sm text-[#475569]">
          Vui lòng nhập thông tin chi tiết để truy cập tài khoản của bạn.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="username"
              placeholder="ten@congty.com"
              className="pl-10 h-11 border-[#e2e8f0] rounded-lg"
              {...form.register("username")}
            />
          </div>
          {form.formState.errors.username && (
            <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">Mật khẩu</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#004ac6] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 border-[#e2e8f0] rounded-lg"
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
          className="w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.loading") : "Đăng nhập"}
        </Button>
      </form>

      <AuthDivider label="HOẶC" />

      <Button
        variant="outline"
        className="w-full h-10 gap-2 border-[#e2e8f0] rounded-lg text-sm font-medium text-gray-900"
        type="button"
      >
        <GoogleIcon />
        Tiếp tục với Google
      </Button>

      <p className="text-center text-sm text-[#475569]">
        Bạn chưa có tài khoản?{" "}
        <Link href="/register" className="font-normal text-[#004ac6] hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const registerAccount = useAuthStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
      await registerAccount({
        ...values,
        phone: values.phone || undefined,
      });
      setEmailSent(true);
    } catch (error) {
      toast({
        type: "error",
        title: t("common.error"),
        description: toErrorMessage(error),
      });
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
            <CheckCircle className="size-8 text-[#2563eb]" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Kiểm tra email của bạn</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Chúng tôi đã gửi link xác thực đến{" "}
            <span className="font-medium text-gray-900">{form.getValues("email")}</span>.
            Vui lòng kiểm tra hộp thư và nhấn vào link để kích hoạt tài khoản.
          </p>
        </div>
        <p className="text-sm text-[#475569]">
          Không nhận được email?{" "}
          <Link href="/resend-verification" className="text-[#004ac6] hover:underline font-medium">
            Gửi lại
          </Link>
        </p>
        <p className="text-sm text-[#475569]">
          <Link href="/login" className="text-[#004ac6] hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-normal text-gray-900">Tạo tài khoản của bạn</h1>
        <p className="mt-2 text-base text-[#475569]">Bắt đầu với FitMatch ngay hôm nay.</p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-base text-gray-900">Họ và Tên</label>
          <Input
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            className="h-11 border-[#e2e8f0] rounded-lg text-base"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-base text-gray-900">Địa chỉ Email</label>
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="h-11 border-[#e2e8f0] rounded-lg text-base"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-base text-gray-900">Số điện thoại</label>
            <Input
              autoComplete="tel"
              placeholder="0901 234 567"
              className="h-11 border-[#e2e8f0] rounded-lg text-base"
              {...form.register("phone")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-base text-gray-900">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 border-[#e2e8f0] rounded-lg text-base"
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
          <label className="text-base text-gray-900">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 h-11 border-[#e2e8f0] rounded-lg text-base"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 py-2">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 accent-[#004ac6]"
          />
          <span className="text-base text-[#475569]">
            Tôi đồng ý với{" "}
            <Link href="#" className="text-[#004ac6] hover:underline">
              Điều khoản Dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="#" className="text-[#004ac6] hover:underline">
              Chính sách Bảo mật
            </Link>
            .
          </span>
        </label>

        <Button
          className="w-full h-12 bg-[#004ac6] hover:bg-[#003a9e] text-white text-base font-normal rounded-lg gap-2"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.loading") : "Đăng ký →"}
        </Button>
      </form>

      <AuthDivider label="HOẶC ĐĂNG KÝ BẰNG" />

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" className="h-11 gap-2 border-[#e2e8f0] rounded-lg text-base font-normal">
          <GoogleIcon />
          Google
        </Button>
        <Button variant="outline" type="button" className="h-11 gap-2 border-[#e2e8f0] rounded-lg text-base font-normal">
          <AppleIcon />
          Apple
        </Button>
      </div>

      <p className="text-center text-base text-[#475569] pt-4">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-[#004ac6] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      await authService.forgotPassword(values.email);
      setSentEmail(values.email);
      setSent(true);
    } catch {
      // BE always returns 200 for security — treat any error as success
      setSentEmail(values.email);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
            <Mail className="size-8 text-[#2563eb]" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Kiểm tra email của bạn</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Nếu <span className="font-medium text-gray-900">{sentEmail}</span> đã đăng ký, chúng tôi
            sẽ gửi link đặt lại mật khẩu trong vài phút. Vui lòng kiểm tra cả hộp thư spam.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm text-[#004ac6] hover:underline font-medium"
        >
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Quên mật khẩu?</h1>
        <p className="mt-2 text-sm text-[#475569]">
          Nhập địa chỉ email bạn đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="pl-10 h-11 border-[#e2e8f0] rounded-lg"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
        </Button>
      </form>
      <p className="text-center text-sm text-[#475569]">
        <Link href="/login" className="text-[#004ac6] hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export function ResetPasswordForm({ token }: { token: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      await authService.resetPassword(token, values.newPassword);
      toast({ type: "success", title: "Mật khẩu đã được đặt lại thành công!" });
      router.replace("/login");
    } catch (error) {
      const code = getErrorCode(error);
      toast({
        type: "error",
        title: code === "TOKEN_EXPIRED" ? "Link đã hết hạn" : "Đặt lại mật khẩu thất bại",
        description:
          code === "TOKEN_EXPIRED"
            ? "Vui lòng yêu cầu gửi lại link đặt lại mật khẩu."
            : toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Đặt lại mật khẩu</h1>
        <p className="mt-2 text-sm text-[#475569]">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Mật khẩu mới</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              className="pl-10 pr-10 h-11 border-[#e2e8f0] rounded-lg"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              className="pl-10 h-11 border-[#e2e8f0] rounded-lg"
              {...form.register("confirmPassword")}
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </Button>
      </form>
    </div>
  );
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export function ResendVerificationForm() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const form = useForm<z.infer<typeof resendVerificationSchema>>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof resendVerificationSchema>) {
    try {
      await authService.resendVerification(values.email);
      setSentEmail(values.email);
      setSent(true);
    } catch (error) {
      const code = getErrorCode(error);
      if (code === "EMAIL_ALREADY_VERIFIED") {
        toast({ type: "success", title: "Email đã được xác thực", description: "Bạn có thể đăng nhập ngay." });
        return;
      }
      toast({ type: "error", title: "Gửi thất bại", description: toErrorMessage(error) });
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
            <CheckCircle className="size-8 text-[#2563eb]" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Email đã được gửi!</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Chúng tôi đã gửi link xác thực đến{" "}
            <span className="font-medium text-gray-900">{sentEmail}</span>. Link có hiệu lực trong
            24 giờ.
          </p>
        </div>
        <Link href="/login" className="inline-block text-sm text-[#004ac6] hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gửi lại email xác thực</h1>
        <p className="mt-2 text-sm text-[#475569]">
          Nhập email đã đăng ký để nhận lại link xác thực tài khoản.
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="pl-10 h-11 border-[#e2e8f0] rounded-lg"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang gửi..." : "Gửi lại email xác thực"}
        </Button>
      </form>
      <p className="text-center text-sm text-[#475569]">
        <Link href="/login" className="text-[#004ac6] hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

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
