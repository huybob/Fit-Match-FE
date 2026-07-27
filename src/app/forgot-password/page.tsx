"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle, ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAuthSchemas } from "@/modules/forms/use-auth-schemas";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const router = useRouter();
  const { status } = useAuthStore();
  const isAuthenticated = status === "authenticated";
  const schemas = useAuthSchemas();
  const form = useForm<z.infer<typeof schemas.forgotPassword>>({
    resolver: zodResolver(schemas.forgotPassword),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schemas.forgotPassword>) {
    try {
      await authService.forgotPassword(values.email);
    } catch {
      // BE always returns 200 for security — treat any error as success
    }
    setSentEmail(values.email);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 h-16 flex items-center border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 lg:px-20">
        <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between">
          <Link href="/" className="text-sm text-primary tracking-tight font-normal">
            FitMatch
          </Link>
          {isAuthenticated ? (
            <Button variant="link" size="inline" onClick={() => router.back()} className="flex gap-1 text-sm text-primary">
              <ChevronLeft className="size-3.5" />{t("common.actions.back")}</Button>
          ) : (
            <Link href="/login" className="text-sm text-primary hover:underline">
              {t("auth.backToLoginPlain")}
            </Link>
          )}
        </div>
      </header>

      {/* Main — centered card */}
      <main className="flex-1 relative flex items-center justify-center px-6 overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-[10%] -top-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[60px]" />
        <div className="pointer-events-none absolute -right-[10%] -bottom-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[60px]" />

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="bg-card border border-border rounded-2xl shadow-md p-[41px] w-full">
            {sent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="size-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{t("auth.checkEmailTitle")}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("auth.forgotSentPrefix")}{" "}
                    <span className="font-medium text-foreground">{sentEmail}</span>{" "}
                    {t("auth.forgotSentSuffixShort")}
                  </p>
                </div>
                <div className="border-t border-border w-full pt-5">
                  <p className="text-xs text-muted-foreground/70">
                    {t("auth.rememberedPassword")}{" "}
                    <Link href="/login" className="text-primary hover:underline font-normal">
                      {t("auth.login")}
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Form state ── */
              <div className="flex flex-col gap-[23px]">
                {/* Header */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-semibold text-foreground">{t("auth.forgotTitle")}</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("auth.forgotBody")}
                  </p>
                </div>

                {/* Form */}
                <form
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">{t("auth.email")}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-muted-foreground pointer-events-none" />
                      <Input
                        autoComplete="email"
                        type="email"
                        placeholder="vd: alex@FitMatch.com"
                        className="pl-10 h-11 border-border rounded-lg text-base placeholder:text-muted-foreground/70"
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <Button
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-normal rounded-lg"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? t("common.states.submitting") : "Đặt lại mật khẩu"}
                  </Button>
                </form>

                {/* Footer link */}
                <div className="border-t border-border pt-[25px] flex justify-center">
                  <p className="text-xs text-muted-foreground/70">
                    {t("auth.rememberedPassword")}{" "}
                    <Link href="/login" className="text-primary hover:underline font-normal">
                      {t("auth.login")}
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border bg-card py-6 px-4 sm:px-8 lg:px-20">
        <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between">
          <span className="text-sm text-foreground">FitMatch</span>
          <div className="flex gap-6">
            <Link href="#" className="text-xs font-medium text-muted-foreground/70 underline hover:text-muted-foreground">
              {t("site.privacy")}
            </Link>
            <Link href="#" className="text-xs font-medium text-muted-foreground/70 underline hover:text-muted-foreground">
              {t("site.terms")}
            </Link>
            <Link href="#" className="text-xs font-medium text-muted-foreground/70 underline hover:text-muted-foreground">
              {t("site.support")}
            </Link>
          </div>
          <span className="text-xs font-medium text-muted-foreground/70">
            {t("site.copyright")}
          </span>
        </div>
      </footer>
    </div>
  );
}
