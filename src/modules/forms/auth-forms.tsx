"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

function BackToLoginLink({ className }: { className?: string }) {
  const router = useRouter();
  const { status } = useAuthStore();
  const base = "text-primary hover:underline";
  const cls = className ? `${base} ${className}` : base;

  if (status === "authenticated") {
    return (
      <button onClick={() => router.back()} className={cls}>
        ← Quay lại
      </button>
    );
  }

  return (
    <Link href="/login" className={cls}>
      ← Quay lại đăng nhập
    </Link>
  );
}


// ─── Login ────────────────────────────────────────────────────────────────────

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const user = await login(values);
      toast({ type: "success", title: "Đăng nhập thành công" });
      // F-8: quay lại trang người dùng định vào (chỉ nhận path nội bộ, chống open-redirect).
      const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");
      const safeReturn = returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : null;
      router.replace(safeReturn ?? getHomeRouteForRole(user.role));
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
        title: "Có lỗi xảy ra",
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chào mừng trở lại</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vui lòng nhập thông tin chi tiết để truy cập tài khoản của bạn.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email hoặc tên đăng nhập</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="username"
              placeholder="ten@congty.com hoặc nguyenvana"
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("username")}
            />
          </div>
          {form.formState.errors.username && (
            <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Mật khẩu</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 border-border rounded-lg"
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
          className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>

      {/* F-37: gỡ nút Google giả (không handler, BE không có OAuth) — thêm lại khi có OAuth thật. */}

      <p className="text-center text-sm text-muted-foreground">
        Bạn chưa có tài khoản?{" "}
        <Link href="/register" className="font-normal text-primary hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const { toast } = useToast();
  const registerAccount = useAuthStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      accountType: "CUSTOMER",
    },
  });
  const accountType = form.watch("accountType");

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
        title: "Có lỗi xảy ra",
        description: toErrorMessage(error),
      });
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Kiểm tra email của bạn</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Chúng tôi đã gửi link xác thực đến{" "}
            <span className="font-medium text-foreground">{form.getValues("email")}</span>.
            Vui lòng kiểm tra hộp thư và nhấn vào link để kích hoạt tài khoản.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Không nhận được email?{" "}
          <Link href="/resend-verification" className="text-primary hover:underline font-medium">
            Gửi lại
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          <BackToLoginLink />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-normal text-foreground">Tạo tài khoản của bạn</h1>
        <p className="mt-2 text-base text-muted-foreground">Bắt đầu với FitMatch ngay hôm nay.</p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-base text-foreground">Loại tài khoản</label>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                { value: "CUSTOMER", label: "Khách hàng", hint: "Tìm và đặt lịch tập" },
                { value: "GYM_OPERATOR", label: "Chủ phòng tập", hint: "Đăng ký & vận hành phòng tập" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue("accountType", option.value)}
                aria-pressed={accountType === option.value}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  accountType === option.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="block text-base font-medium text-foreground">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-base text-foreground">Họ và Tên</label>
            <Input
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-base text-foreground">Tên đăng nhập</label>
            <Input
              autoComplete="username"
              placeholder="nguyenvana"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-base text-foreground">Địa chỉ Email</label>
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-base text-foreground">Số điện thoại</label>
            <Input
              autoComplete="tel"
              placeholder="0901 234 567"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("phone")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-base text-foreground">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 border-border rounded-lg text-base"
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
          <label className="text-base text-foreground">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 border-border rounded-lg text-base"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 py-2">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 accent-[#004ac6]"
          />
          <span className="text-base text-muted-foreground">
            Tôi đồng ý với{" "}
            <Link href="#" className="text-primary hover:underline">
              Điều khoản Dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="#" className="text-primary hover:underline">
              Chính sách Bảo mật
            </Link>
            .
          </span>
        </label>

        <Button
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-base font-normal rounded-lg gap-2"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang xử lý..." : "Đăng ký →"}
        </Button>
      </form>

      {/* F-37: gỡ nút Google/Apple giả (không handler, BE không có OAuth). */}

      <p className="text-center text-base text-muted-foreground pt-4">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-primary hover:underline">
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
    mode: "onTouched",
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
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Kiểm tra email của bạn</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nếu <span className="font-medium text-foreground">{sentEmail}</span> đã đăng ký, chúng tôi
            sẽ gửi link đặt lại mật khẩu trong vài phút. Vui lòng kiểm tra cả hộp thư spam.
          </p>
        </div>
        <BackToLoginLink className="inline-block text-sm font-medium" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Quên mật khẩu?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhập địa chỉ email bạn đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-white rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <BackToLoginLink />
      </p>
    </div>
  );
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export function ResetPasswordForm({ token }: { token: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      await authService.resetPassword(token, values.newPassword);
      toast({ type: "success", title: "Mật khẩu đã được đặt lại thành công!" });
      router.replace("/login");
    } catch (error) {
      const code = getErrorCode(error);
      // A-16 (audit 2026-07-17): BE trả VERIFICATION_TOKEN_INVALID cho cả token sai
      // lẫn hết hạn (không có mã TOKEN_EXPIRED riêng) — gộp thông điệp cho khớp.
      const tokenInvalid = code === "VERIFICATION_TOKEN_INVALID" || code === "TOKEN_EXPIRED";
      toast({
        type: "error",
        title: tokenInvalid ? "Link không hợp lệ hoặc đã hết hạn" : "Đặt lại mật khẩu thất bại",
        description: tokenInvalid
          ? "Vui lòng yêu cầu gửi lại link đặt lại mật khẩu."
          : toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Đặt lại mật khẩu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Mật khẩu mới</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              className="pl-10 pr-10 h-11 border-border rounded-lg"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
          <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="new-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              className="pl-10 pr-10 h-11 border-border rounded-lg"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-white rounded-lg"
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
    mode: "onTouched",
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
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Email đã được gửi!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Chúng tôi đã gửi link xác thực đến{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>. Link có hiệu lực trong
            24 giờ.
          </p>
        </div>
        <BackToLoginLink className="inline-block text-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Gửi lại email xác thực</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhập email đã đăng ký để nhận lại link xác thực tài khoản.
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-white rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Đang gửi..." : "Gửi lại email xác thực"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <BackToLoginLink />
      </p>
    </div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

export function ChangePasswordForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof changePasswordSchema>) {
    try {
      await authService.changePassword(values);
      form.reset();
      toast({ type: "success", title: "Đổi mật khẩu thành công" });
    } catch (error) {
      toast({
        type:
          getErrorCode(error) === "INVALID_CREDENTIALS" ? "warning" : "error",
        title: "Có lỗi xảy ra",
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldShell
        label="Mật khẩu hiện tại"
        error={form.formState.errors.oldPassword}
      >
        <Input
          autoComplete="current-password"
          type="password"
          {...form.register("oldPassword")}
        />
      </FieldShell>
      <FieldShell
        label="Mật khẩu mới"
        error={form.formState.errors.newPassword}
      >
        <Input
          autoComplete="new-password"
          type="password"
          {...form.register("newPassword")}
        />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
