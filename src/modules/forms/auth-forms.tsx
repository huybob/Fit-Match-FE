"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { getPostLoginRoute } from "@/modules/auth/auth-routing";
import { useAuthStore } from "@/modules/auth/auth.store";
import { GoogleSignInButton } from "@/modules/auth/google-sign-in-button";
import type { AuthUser } from "@/services/auth.service";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { PasswordInput } from "@/shared/components/ui/password-input";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";
import { FieldShell } from "./form-controls";
import { useAuthSchemas } from "./use-auth-schemas";
import { useTranslations } from "next-intl";

function BackToLoginLink({ className }: { className?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { status } = useAuthStore();
  const base = "text-primary hover:underline";
  const cls = className ? `${base} ${className}` : base;

  if (status === "authenticated") {
    return (
      <button onClick={() => router.back()} className={cls}>
        {t("auth.back")}
      </button>
    );
  }

  return (
    <Link href="/login" className={cls}>
      {t("auth.backToLogin")}
    </Link>
  );
}


// ─── Login ────────────────────────────────────────────────────────────────────

export function LoginForm() {
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const { toast } = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const form = useForm<z.infer<typeof schemas.login>>({
    resolver: zodResolver(schemas.login),
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  // Đăng nhập bằng mật khẩu và bằng Google về chung một chỗ: F-8 quay lại trang
  // người dùng định vào, mặc định là workspace của role.
  function afterLogin(user: AuthUser) {
    toast({ type: "success", title: t("auth.loginSuccess") });
    router.replace(getPostLoginRoute(user.role));
  }

  async function onSubmit(values: z.infer<typeof schemas.login>) {
    try {
      afterLogin(await login(values));
    } catch (error) {
      const code = getErrorCode(error);
      if (code === "EMAIL_NOT_VERIFIED") {
        toast({
          type: "warning",
          title: t("auth.emailNotVerified"),
          description: t("auth.emailNotVerifiedDesc"),
        });
        router.push("/resend-verification");
        return;
      }
      // Sai tài khoản/mật khẩu là lỗi thường gặp nhất — hiện thông báo tiếng Việt
      // thay cho message thô của BE, giữ nguyên dữ liệu đã gõ và đưa con trỏ về
      // ô mật khẩu để nhập lại ngay.
      if (code === "INVALID_CREDENTIALS") {
        toast({
          type: "error",
          title: t("auth.invalidCredentials"),
          description: t("auth.invalidCredentialsDesc"),
        });
        form.setFocus("password");
        return;
      }
      toast({
        type: "error",
        title: t("auth.genericError"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("auth.welcomeBack")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.loginHint")}
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("auth.identifierLabel")}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              autoComplete="username"
              placeholder={t("auth.identifierPlaceholder")}
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("username")}
            />
          </div>
          {form.formState.errors.username && (
            <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{t("auth.passwordLabel")}</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <PasswordInput
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.states.processing") : t("auth.login")}
        </Button>
      </form>

      {/* UC-003: nút thật của Google Identity Services; tự ẩn nếu chưa cấu hình client id. */}
      <GoogleSignInButton onSuccess={afterLogin} />

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-normal text-primary hover:underline">
          {t("auth.register")}
        </Link>
      </p>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const { toast } = useToast();
  const router = useRouter();
  const registerAccount = useAuthStore((state) => state.register);
  const form = useForm<z.infer<typeof schemas.register>>({
    resolver: zodResolver(schemas.register),
    mode: "onTouched",
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      accountType: "CUSTOMER",
      terms: false,
    },
  });
  const accountType = form.watch("accountType");

  async function onSubmit(values: z.infer<typeof schemas.register>) {
    // confirmPassword/terms chỉ dùng phía client — không gửi lên BE
    const { confirmPassword: _confirm, terms: _terms, ...payload } = values;
    try {
      await registerAccount({
        ...payload,
        phone: payload.phone || undefined,
      });
      // Đăng ký xong chuyển hẳn sang trang thành công (kèm email để mở đúng hộp
      // thư). Dùng replace để nút Back không quay lại form đã submit.
      router.replace(`/register/success?email=${encodeURIComponent(payload.email)}`);
    } catch (error) {
      toast({
        type: "error",
        title: t("auth.genericError"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-normal text-foreground">{t("auth.createAccountTitle")}</h1>
        <p className="mt-2 text-base text-muted-foreground">{t("auth.createAccountHint")}</p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-base text-foreground">{t("auth.accountType")}</label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                { value: "CUSTOMER", label: t("auth.roleCustomer"), hint: t("auth.roleCustomerHint") },
                { value: "GYM_OPERATOR", label: t("auth.roleGym"), hint: t("auth.roleGymHint") },
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-base text-foreground">{t("auth.fullName")}</label>
            <Input
              autoComplete="name"
              placeholder={t("auth.fullNamePlaceholder")}
              className="h-11 border-border rounded-lg text-base"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-base text-foreground">{t("auth.username")}</label>
            <Input
              autoComplete="username"
              placeholder="nguyenvana"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-base text-foreground">{t("auth.email")}</label>
            <Input
              autoComplete="email"
              type="email"
              placeholder="ten@congty.com"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-base text-foreground">{t("common.table.phone")}</label>
            <Input
              autoComplete="tel"
              placeholder="0901 234 567"
              className="h-11 border-border rounded-lg text-base"
              {...form.register("phone")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-base text-foreground">{t("auth.passwordLabel")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-10 h-11 border-border rounded-lg text-base"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-base text-foreground">{t("auth.confirmPassword")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              className="pl-10 h-11 border-border rounded-lg text-base"
              {...form.register("confirmPassword")}
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="py-2">
          <Controller
            control={form.control}
            name="terms"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-base text-muted-foreground">
                  {t("auth.agreeTo")}{" "}
                  <Link href="#" className="text-primary hover:underline">
                    {t("auth.terms")}
                  </Link>{" "}
                  {t("auth.and")}{" "}
                  <Link href="#" className="text-primary hover:underline">
                    {t("auth.privacy")}
                  </Link>
                  .
                </span>
              </label>
            )}
          />
          {form.formState.errors.terms && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.terms.message}</p>
          )}
        </div>

        <Button
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-normal rounded-lg gap-2"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.states.processing") : t("auth.registerArrow")}
        </Button>
      </form>

      {/* UC-003: đăng ký bằng Google luôn tạo tài khoản CUSTOMER (đã xác minh email
          sẵn) — chủ phòng tập còn phải khai hồ sơ gym nên chỉ đi đường form. */}
      {accountType === "CUSTOMER" && (
        <GoogleSignInButton
          text="signup_with"
          onSuccess={(user) => {
            toast({ type: "success", title: t("auth.loginSuccess") });
            router.replace(getPostLoginRoute(user.role));
          }}
        />
      )}

      <p className="text-center text-base text-muted-foreground pt-4">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </div>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const form = useForm<z.infer<typeof schemas.forgotPassword>>({
    resolver: zodResolver(schemas.forgotPassword),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schemas.forgotPassword>) {
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
          <h2 className="text-2xl font-semibold text-foreground">{t("auth.checkEmailTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.forgotSentPrefix")}{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>{" "}
            {t("auth.forgotSentSuffix")}
          </p>
        </div>
        <BackToLoginLink className="inline-block text-sm font-medium" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("auth.forgotPassword")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.forgotHint")}
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("auth.email")}</label>
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
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.states.submitting") : t("auth.sendResetLink")}
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
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof schemas.resetPassword>>({
    resolver: zodResolver(schemas.resetPassword),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof schemas.resetPassword>) {
    try {
      await authService.resetPassword(token, values.newPassword);
      toast({ type: "success", title: t("auth.resetSuccess") });
      router.replace("/login");
    } catch (error) {
      const code = getErrorCode(error);
      // A-16 (audit 2026-07-17): BE trả VERIFICATION_TOKEN_INVALID cho cả token sai
      // lẫn hết hạn (không có mã TOKEN_EXPIRED riêng) — gộp thông điệp cho khớp.
      const tokenInvalid = code === "VERIFICATION_TOKEN_INVALID" || code === "TOKEN_EXPIRED";
      toast({
        type: "error",
        title: tokenInvalid ? t("auth.linkInvalid") : t("auth.resetFailed"),
        description: tokenInvalid
          ? t("auth.requestNewLink")
          : toErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("auth.resetTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.resetHint")}</p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("auth.newPassword")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <PasswordInput
              autoComplete="new-password"
              placeholder={t("auth.min6")}
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("newPassword")}
            />
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("auth.confirmPassword")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <PasswordInput
              autoComplete="new-password"
              placeholder={t("auth.reenterPassword")}
              className="pl-10 h-11 border-border rounded-lg"
              {...form.register("confirmPassword")}
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.states.saving") : t("auth.resetTitle")}
        </Button>
      </form>
    </div>
  );
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export function ResendVerificationForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const form = useForm<z.infer<typeof schemas.resendVerification>>({
    resolver: zodResolver(schemas.resendVerification),
    mode: "onTouched",
    // Đến từ trang đăng ký thành công thì email đã biết — điền sẵn để người dùng
    // chỉ việc bấm gửi lại.
    defaultValues: { email: defaultEmail },
  });

  async function onSubmit(values: z.infer<typeof schemas.resendVerification>) {
    try {
      await authService.resendVerification(values.email);
      setSentEmail(values.email);
      setSent(true);
    } catch (error) {
      const code = getErrorCode(error);
      if (code === "EMAIL_ALREADY_VERIFIED") {
        toast({ type: "success", title: t("auth.emailVerified"), description: t("auth.canLoginNow") });
        return;
      }
      toast({ type: "error", title: t("auth.sendFailed"), description: toErrorMessage(error) });
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
          <h2 className="text-2xl font-semibold text-foreground">{t("auth.emailSent")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.sentVerifyTo")}{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>{t("auth.linkValidPrefix")}
            {t("auth.linkValid24h")}
          </p>
        </div>
        <BackToLoginLink className="inline-block text-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("auth.resendVerify")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.resendVerifyHint")}
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("auth.email")}</label>
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
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("common.states.submitting") : t("auth.resendVerify")}
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
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof schemas.changePassword>>({
    resolver: zodResolver(schemas.changePassword),
    mode: "onTouched",
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof schemas.changePassword>) {
    try {
      await authService.changePassword(values);
      form.reset();
      toast({ type: "success", title: t("auth.passwordChanged") });
    } catch (error) {
      toast({
        type:
          getErrorCode(error) === "INVALID_CREDENTIALS" ? "warning" : "error",
        title: t("auth.genericError"),
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
        {form.formState.isSubmitting ? t("common.states.processing") : t("common.actions.saveChanges")}
      </Button>
    </form>
  );
}
