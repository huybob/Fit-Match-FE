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
import { forgotPasswordSchema } from "@/modules/forms/schemas";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const router = useRouter();
  const { status } = useAuthStore();
  const isAuthenticated = status === "authenticated";
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      await authService.forgotPassword(values.email);
    } catch {
      // BE always returns 200 for security — treat any error as success
    }
    setSentEmail(values.email);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 h-16 flex items-center border-b border-[#e2e8f0] bg-white/80 backdrop-blur-md px-20">
        <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between">
          <Link href="/" className="text-sm text-[#004ac6] tracking-tight font-normal">
            FitMatch
          </Link>
          {isAuthenticated ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-[#004ac6] hover:underline"
            >
              <ChevronLeft className="size-3.5" />
              Quay lại
            </button>
          ) : (
            <Link href="/login" className="text-sm text-[#004ac6] hover:underline">
              Quay lại Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* Main — centered card */}
      <main className="flex-1 relative flex items-center justify-center px-6 overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-[10%] -top-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/20 blur-[60px]" />
        <div className="pointer-events-none absolute -right-[10%] -bottom-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/20 blur-[60px]" />

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-md p-[41px] w-full">
            {sent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-blue-50">
                  <CheckCircle className="size-7 text-[#2563eb]" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Kiểm tra email của bạn</h1>
                  <p className="mt-2 text-sm text-[#475569]">
                    Nếu{" "}
                    <span className="font-medium text-gray-900">{sentEmail}</span> đã đăng ký, chúng
                    tôi sẽ gửi link đặt lại mật khẩu trong vài phút. Kiểm tra cả thư mục spam.
                  </p>
                </div>
                <div className="border-t border-[#e2e8f0] w-full pt-5">
                  <p className="text-xs text-[#94a3b8]">
                    Bạn đã nhớ mật khẩu?{" "}
                    <Link href="/login" className="text-[#004ac6] hover:underline font-normal">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Form state ── */
              <div className="flex flex-col gap-[23px]">
                {/* Header */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-semibold text-[#0f172a]">Quên mật khẩu?</h1>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại
                    mật khẩu.
                  </p>
                </div>

                {/* Form */}
                <form
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#0f172a]">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-gray-400 pointer-events-none" />
                      <Input
                        autoComplete="email"
                        type="email"
                        placeholder="vd: alex@FitMatch.com"
                        className="pl-10 h-11 border-[#e2e8f0] rounded-lg text-base placeholder:text-[#94a3b8]"
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <Button
                    className="w-full h-10 bg-[#004ac6] hover:bg-[#003a9e] text-white text-sm font-normal rounded-lg"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Đang gửi..." : "Đặt lại mật khẩu"}
                  </Button>
                </form>

                {/* Footer link */}
                <div className="border-t border-[#e2e8f0] pt-[25px] flex justify-center">
                  <p className="text-xs text-[#94a3b8]">
                    Bạn đã nhớ mật khẩu?{" "}
                    <Link href="/login" className="text-[#004ac6] hover:underline font-normal">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-[#e2e8f0] bg-white py-6 px-20">
        <div className="flex w-full max-w-[1440px] mx-auto items-center justify-between">
          <span className="text-sm text-[#0f172a]">FitMatch</span>
          <div className="flex gap-6">
            <Link href="#" className="text-xs font-medium text-[#94a3b8] underline hover:text-gray-600">
              Chính sách bảo mật
            </Link>
            <Link href="#" className="text-xs font-medium text-[#94a3b8] underline hover:text-gray-600">
              Điều khoản dịch vụ
            </Link>
            <Link href="#" className="text-xs font-medium text-[#94a3b8] underline hover:text-gray-600">
              Hỗ trợ
            </Link>
          </div>
          <span className="text-xs font-medium text-[#94a3b8]">
            © 2024 FitMatch Marketplace. Bảo lưu mọi quyền.
          </span>
        </div>
      </footer>
    </div>
  );
}
