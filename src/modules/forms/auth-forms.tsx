"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { getHomeRouteForRole } from "@/modules/auth/auth-routing";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/components/ui/button";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";
import { FieldShell, inputClassName } from "./form-controls";
import { changePasswordSchema, loginSchema, registerSchema } from "./schemas";

export function LoginForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
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
      toast({ type: "error", title: t("common.error"), description: toErrorMessage(error) });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldShell label={t("auth.username")} error={form.formState.errors.username}>
        <input autoComplete="username" className={inputClassName} {...form.register("username")} />
      </FieldShell>
      <FieldShell label={t("auth.password")} error={form.formState.errors.password}>
        <input autoComplete="current-password" className={inputClassName} type="password" {...form.register("password")} />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.login")}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const registerAccount = useAuthStore((state) => state.register);
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
    try {
      const user = await registerAccount({ ...values, phone: values.phone || undefined });
      toast({ type: "success", title: t("auth.registerSuccess") });
      router.replace(getHomeRouteForRole(user.role));
    } catch (error) {
      toast({ type: "error", title: t("common.error"), description: toErrorMessage(error) });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldShell label={t("auth.username")} error={form.formState.errors.username}>
        <input autoComplete="username" className={inputClassName} {...form.register("username")} />
      </FieldShell>
      <FieldShell label={t("auth.email")} error={form.formState.errors.email}>
        <input autoComplete="email" className={inputClassName} type="email" {...form.register("email")} />
      </FieldShell>
      <FieldShell label={t("auth.phone")} error={form.formState.errors.phone}>
        <input autoComplete="tel" className={inputClassName} {...form.register("phone")} />
      </FieldShell>
      <FieldShell label={t("auth.role")} error={form.formState.errors.role}>
        <select className={inputClassName} {...form.register("role")}>
          <option value="ROLE_CUSTOMER">{t("auth.customer")}</option>
          <option value="ROLE_PT">{t("auth.trainer")}</option>
          <option value="ROLE_GYM_OPERATOR">{t("auth.gymOperator")}</option>
        </select>
      </FieldShell>
      <FieldShell label={t("auth.password")} error={form.formState.errors.password}>
        <input autoComplete="new-password" className={inputClassName} type="password" {...form.register("password")} />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.register")}
      </Button>
    </form>
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
        type: getErrorCode(error) === "INVALID_CREDENTIALS" ? "warning" : "error",
        title: t("common.error"),
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldShell label={t("auth.currentPassword")} error={form.formState.errors.oldPassword}>
        <input autoComplete="current-password" className={inputClassName} type="password" {...form.register("oldPassword")} />
      </FieldShell>
      <FieldShell label={t("auth.newPassword")} error={form.formState.errors.newPassword}>
        <input autoComplete="new-password" className={inputClassName} type="password" {...form.register("newPassword")} />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
