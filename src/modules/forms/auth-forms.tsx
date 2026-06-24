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
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";
import { FieldShell } from "./form-controls";
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
        <Input autoComplete="username" {...form.register("username")} />
      </FieldShell>
      <FieldShell label={t("auth.password")} error={form.formState.errors.password}>
        <Input autoComplete="current-password" type="password" {...form.register("password")} />
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
        <Input autoComplete="username" {...form.register("username")} />
      </FieldShell>
      <FieldShell label={t("auth.email")} error={form.formState.errors.email}>
        <Input autoComplete="email" type="email" {...form.register("email")} />
      </FieldShell>
      <FieldShell label={t("auth.phone")} error={form.formState.errors.phone}>
        <Input autoComplete="tel" {...form.register("phone")} />
      </FieldShell>
      <FieldShell label={t("auth.role")} error={form.formState.errors.role}>
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROLE_CUSTOMER">{t("auth.customer")}</SelectItem>
                <SelectItem value="ROLE_PT">{t("auth.trainer")}</SelectItem>
                <SelectItem value="ROLE_GYM_OPERATOR">{t("auth.gymOperator")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>
      <FieldShell label={t("auth.password")} error={form.formState.errors.password}>
        <Input autoComplete="new-password" type="password" {...form.register("password")} />
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
        <Input autoComplete="current-password" type="password" {...form.register("oldPassword")} />
      </FieldShell>
      <FieldShell label={t("auth.newPassword")} error={form.formState.errors.newPassword}>
        <Input autoComplete="new-password" type="password" {...form.register("newPassword")} />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
