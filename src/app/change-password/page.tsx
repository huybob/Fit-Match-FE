"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Monitor,
  Save,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { useAuthSchemas } from "@/modules/forms/use-auth-schemas";
import { useToast } from "@/lib/toast-provider";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { ProfileSidebar } from "@/modules/user/components/profile-sidebar";
import { Button } from "@/shared/components/ui/button";
import { PasswordInput } from "@/shared/components/ui/password-input";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";


/*
 * BUG-03: khối "phiên đăng nhập" và "lịch sử đăng nhập" trước đây hiển thị dữ
 * liệu giả CỨNG cho mọi user (MacBook ở San Francisco, iPhone ở London, Windows
 * ở Berlin) kèm nút đăng xuất thao tác trên các phiên không tồn tại.
 *
 * Trên một trang BẢO MẬT, dữ liệu bịa không phải là "placeholder cho đẹp" — nó
 * khiến người dùng tin rằng mình đang bị đăng nhập ở nước ngoài, hoặc yên tâm vì
 * "2FA đã bật" trong khi hệ thống chưa hề có 2FA. Thà nói thẳng là chưa hỗ trợ.
 *
 * Dữ liệu giả đã được gỡ. Khi BE có endpoint phiên/lịch sử thật (Phase 5), thay
 * phần "chưa khả dụng" bằng dữ liệu thật.
 */

function SecurityScoreCard({ user }: { user: { emailVerified?: boolean } }) {
  const t = useTranslations();

  /*
   * BUG-03: điểm trước đây là hằng số 82% và mục 2FA luôn `ok: true`, nên mọi
   * tài khoản đều được báo "RẤT MẠNH · đã bật 2FA" kể cả khi hệ thống chưa có
   * 2FA. Đây là kiểu sai nguy hiểm nhất của một trang bảo mật: nó khiến người
   * dùng ngừng đề phòng.
   *
   * Nay điểm được TÍNH từ đúng những gì kiểm chứng được. 2FA chưa hỗ trợ nên
   * hiển thị là chưa đạt, không phải đã đạt.
   */
  const checks = [
    { ok: false, label: t("security.check2fa"), warn: true },
    { ok: user.emailVerified ?? false, label: t("security.checkRecoveryEmail") },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-5">{t("security.scoreTitle")}</h2>
      <div className="flex flex-col items-center mb-5">
        {/* Màu lấy từ design token: vòng điểm trước đây hardcode nên gần như
            vô hình ở chế độ tối. */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          role="img"
          aria-label={t("security.scoreAria", { score })}
        >
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="var(--success)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="66" textAnchor="middle" className="text-2xl font-bold" fill="var(--foreground)" fontSize="22" fontWeight="700">{score}%</text>
          {/* BUG-03: nhãn trước đây luôn cứng là "RẤT MẠNH" bất kể điểm bao nhiêu. */}
          <text x="70" y="84" textAnchor="middle" fill={score >= 100 ? "var(--success)" : "var(--warning)"} fontSize="11" fontWeight="600">
            {score >= 100 ? t("security.veryStrong") : t("security.needsAttention")}
          </text>
        </svg>
      </div>
      <div className="space-y-2 mb-4">
        {checks.map(({ ok, label, warn }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            {ok ? (
              <CheckCircle className="size-3.5 text-success shrink-0" />
            ) : warn ? (
              <AlertTriangle className="size-3.5 text-warning shrink-0" />
            ) : (
              <XCircle className="size-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <span className={ok ? "text-muted-foreground" : warn ? "text-warning" : "text-muted-foreground"}>{label}</span>
          </div>
        ))}
      </div>
      {/* BUG-03: gỡ nút "Cải thiện điểm" — nó không gắn với hành động nào. */}
    </div>
  );
}

function PasswordField({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <PasswordInput
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="text-base"
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ChangePasswordCard() {
  const t = useTranslations();
  const schemas = useAuthSchemas();
  const schema = schemas.changePasswordWithConfirm;
  type ChangePasswordValues = z.infer<typeof schema>;
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setSuccess(false);
    try {
      await authService.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      form.reset();
      setSuccess(true);
      toast({ type: "success", title: t("security.changedSuccess") });
    } catch (error) {
      toast({
        type: getErrorCode(error) === "INVALID_CREDENTIALS" ? "warning" : "error",
        title: t("common.states.failed"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="size-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">{t("security.changeTitle")}</h2>
      </div>
      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-success-muted px-4 py-3 text-sm font-medium text-success">
          <CheckCircle className="size-4 shrink-0" /> {t("security.changedNote")}
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          label={t("security.currentPassword")}
          autoComplete="current-password"
          error={form.formState.errors.oldPassword?.message}
          {...form.register("oldPassword")}
        />
        <div className="grid grid-cols-2 gap-4">
          <PasswordField
            label={t("security.newPassword")}
            autoComplete="new-password"
            error={form.formState.errors.newPassword?.message}
            {...form.register("newPassword")}
          />
          <PasswordField
            label={t("security.confirmNewPassword")}
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register("confirmPassword")}
          />
        </div>
        <p className="text-xs text-warning">{t("security.passwordRule")}</p>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-lg gap-2"
          >
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("security.updatePassword")}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Khối "chưa khả dụng" dùng chung cho phiên đăng nhập và lịch sử đăng nhập. */
function NotAvailableCard({ title, body }: { title: string; body: string }) {
  const t = useTranslations();
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
        <Monitor className="size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("security.notAvailableTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
        </div>
      </div>
    </div>
  );
}

function ActiveSessionsCard() {
  const t = useTranslations();
  // BUG-03: bỏ nút "Đăng xuất thiết bị khác" — nó thao tác trên danh sách phiên
  // bịa, tạo cảm giác an toàn giả cho một hành động không làm gì cả.
  return (
    <NotAvailableCard
      title={t("security.activeSessions")}
      body={t("security.sessionsNotAvailableBody")}
    />
  );
}

function LoginHistoryCard() {
  const t = useTranslations();
  return (
    <NotAvailableCard
      title={t("security.loginHistory")}
      body={t("security.historyNotAvailableBody")}
    />
  );
}

function DangerZoneCard() {
  const t = useTranslations();
  const { toast } = useToast();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDisable() {
    if (!password) return;
    setLoading(true);
    try {
      await authService.deactivateAccount(password);
      toast({ type: "success", title: t("security.accountDisabled") });
      await logout();
      router.replace("/login");
    } catch (error) {
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-destructive/30 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="size-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("security.dangerZone")}</h2>
          <p className="text-sm text-muted-foreground leading-6 mt-1 max-w-2xl">
            {t("security.dangerBody")}
          </p>
        </div>
      </div>

      {!confirming ? (
        <div className="flex items-center gap-3 mt-5">
          <Button
            onClick={() => setConfirming(true)}
            className="h-10 border border-warning/30 bg-warning-muted text-warning hover:bg-warning-muted px-5 font-medium shadow-none"
          >
            {t("security.disableAccount")}
          </Button>
          <Button
            onClick={() => toast({ type: "warning", title: t("security.inDevelopment") })}
            className="h-10 border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10 px-5 font-medium shadow-none"
          >
            {t("security.deletePermanently")}
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3 rounded-xl bg-destructive/10 border border-destructive/30 p-4 max-w-md">
          <p className="text-sm font-medium text-destructive">{t("security.confirmDisablePrompt")}</p>
          <div className="relative">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("security.yourPassword")}
              className="h-10 border-destructive/30 text-sm"
              autoComplete="current-password"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDisable}
              disabled={!password || loading}
              className="h-9 bg-destructive hover:bg-destructive text-destructive-foreground px-4 text-sm gap-1.5"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />} {t("security.confirmDisable")}
            </Button>
            <Button
              onClick={() => { setConfirming(false); setPassword(""); }}
              className="h-9 border border-border bg-card text-muted-foreground hover:bg-muted/40 px-4 text-sm shadow-none"
            >{t("common.actions.cancel")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityContent() {
  const t = useTranslations();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 xl:px-20">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Header */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-foreground">FitMatch</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("security.subtitle")}</p>
          </section>

          {/* Top row: Security score + Change password */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SecurityScoreCard user={user ?? {}} />
            </div>
            <div className="lg:col-span-8">
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
