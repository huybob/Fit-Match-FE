"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { authService } from "@/services/auth.service";
import { AuthPageShell } from "@/shared/components/common/auth-page-shell";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "no-token") {
    return (
      <div className="space-y-4 text-center py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Link không hợp lệ</h1>
        <p className="text-sm text-[#475569]">Không tìm thấy token xác thực trong link.</p>
        <Link href="/resend-verification" className="text-sm text-[#004ac6] hover:underline">
          Gửi lại email xác thực
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="size-10 text-[#2563eb] animate-spin" />
        <p className="text-sm text-[#475569]">Đang xác thực email của bạn...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="size-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Email đã xác thực!</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-4">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="size-8 text-red-500" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Xác thực thất bại</h2>
        <p className="mt-2 text-sm text-[#475569]">
          Link xác thực không hợp lệ hoặc đã hết hạn (24 giờ).
        </p>
      </div>
      <Link href="/resend-verification" className="text-sm text-[#004ac6] hover:underline">
        Gửi lại email xác thực
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthPageShell variant="login">
      <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="size-8 animate-spin text-gray-400" /></div>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthPageShell>
  );
}
