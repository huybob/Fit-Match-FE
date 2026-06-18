"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { FieldShell, inputClassName } from "./form-controls";
import { forgotPasswordSchema, loginSchema, registerSchema } from "./schemas";

export function LoginForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "member@fitmatch.vn", password: "123456" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(() => {
        toast({ type: "success", title: t("auth.loginSuccess") });
      })}
    >
      <FieldShell label={t("auth.email")} error={form.formState.errors.email}>
        <input className={inputClassName} {...form.register("email")} />
      </FieldShell>
      <FieldShell label={t("auth.password")} error={form.formState.errors.password}>
        <input className={inputClassName} type="password" {...form.register("password")} />
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
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(() => {
        toast({ type: "success", title: t("auth.registerSuccess") });
      })}
    >
      <FieldShell label={t("auth.name")} error={form.formState.errors.name}>
        <input className={inputClassName} {...form.register("name")} />
      </FieldShell>
      <FieldShell label={t("auth.phone")} error={form.formState.errors.phone}>
        <input className={inputClassName} {...form.register("phone")} />
      </FieldShell>
      <FieldShell label={t("auth.email")} error={form.formState.errors.email}>
        <input className={inputClassName} {...form.register("email")} />
      </FieldShell>
      <FieldShell label={t("auth.password")} error={form.formState.errors.password}>
        <input className={inputClassName} type="password" {...form.register("password")} />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.register")}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(() => {
        toast({ type: "success", title: t("auth.forgotSuccess") });
      })}
    >
      <FieldShell label={t("auth.email")} error={form.formState.errors.email}>
        <input className={inputClassName} {...form.register("email")} />
      </FieldShell>
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.confirm")}
      </Button>
    </form>
  );
}
