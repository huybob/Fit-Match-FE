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
  Smartphone,
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


/**
 * Dữ liệu demo cho khối "phiên đăng nhập" / "lịch sử đăng nhập" — BE chưa có
 * endpoint (Phase 5). Cố ý KHÔNG đưa vào catalog i18n để không lẫn dữ liệu giả
 * vào bộ chuỗi thật.
 */
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

function SecurityScoreCard({ user }: { user: { emailVerified?: boolean } }) {
  const t = useTranslations();
  const score = 82;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  const checks = [
    { ok: true, label: t("security.check2fa") },
    { ok: user.emailVerified ?? false, label: t("security.checkRecoveryEmail") },
    { ok: false, label: t("security.checkLastChange"), warn: true },
  ];

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
          <text x="70" y="84" textAnchor="middle" fill="var(--success)" fontSize="11" fontWeight="600">{t("security.veryStrong")}</text>
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
      <button className="w-full h-9 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary transition-colors">
        {t("security.improveScore")}
      </button>
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

function ActiveSessionsCard() {
  const t = useTranslations();
  const { toast } = useToast();
  function logoutAll() {
    toast({ type: "info", title: t("security.logoutAllDevices"), description: t("security.comingSoon") });
  }
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">{t("security.activeSessions")}</h2>
        <Button variant="link" size="inline" onClick={logoutAll} className="text-primary">
          {t("security.logoutOtherDevices")}
        </Button>
      </div>
      <div className="space-y-4">
        {mockSessions.map(({ id, device, location, icon: DevIcon, current }) => (
          <div key={id} className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <DevIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{device}</p>
                {current && (
                  <span className="px-2 py-0.5 rounded-full bg-success-muted text-success text-[10px] font-semibold">{t("security.current")}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{location}</p>
            </div>
            {!current && (
              <Button variant="link" size="inline" className="text-destructive shrink-0">{t("common.menu.logout")}</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginHistoryCard() {
  const t = useTranslations();
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-5">{t("security.loginHistory")}</h2>
      <div className="space-y-4">
        {mockLoginHistory.map(({ id, status, title, detail, time }) => (
          <div key={id} className="flex items-start gap-3">
            <div className={`size-2 rounded-full mt-1.5 shrink-0 ${
              status === "success" ? "bg-success" : status === "fail" ? "bg-destructive" : "bg-primary"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </div>
            <p className="text-[10px] text-muted-foreground shrink-0 text-right leading-tight">{time.split(",")[0]}<br />{time.split(",")[1]}</p>
          </div>
        ))}
      </div>
      <Button variant="link" size="inline" className="mt-4 text-primary">{t("security.viewFullLog")}</Button>
    </div>
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
