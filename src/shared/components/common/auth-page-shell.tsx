"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { ReactNode } from "react";

interface AuthPageShellProps {
  variant: "login" | "register";
  children: ReactNode;
}

export function AuthPageShell({ variant, children }: AuthPageShellProps) {
  const isLogin = variant === "login";

  const bluePanel = (
    <div className="hidden overflow-hidden bg-primary lg:flex lg:flex-col p-10 text-white">
      {!isLogin && (
        <>
          <Link href="/" className="text-xl font-bold text-white">
            FitMatch
          </Link>
          <div className="flex flex-col justify-center flex-1 py-8">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-card/15 mb-8">
              <Rocket className="size-8" />
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight max-w-sm">
              Nâng Tầm Hành Trình Tập Luyện.
            </h2>
            <p className="mt-5 text-blue-100 leading-relaxed max-w-sm">
              Tham gia mạng lưới hàng đầu dành cho các chuyên gia thể hình và phòng gym cao cấp. Sự thay đổi của bạn bắt đầu từ đây.
            </p>
            <div className="mt-10 flex gap-3">
              <div className="rounded-xl bg-card/15 px-5 py-3">
                <p className="text-2xl font-black">500+</p>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mt-0.5">
                  HLV Chuyên Nghiệp
                </p>
              </div>
              <div className="rounded-xl bg-card/15 px-5 py-3">
                <p className="text-2xl font-black">1.2k</p>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mt-0.5">
                  Phòng Gym Cao Cấp
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className={`flex flex-1 lg:grid ${isLogin ? "lg:grid-cols-[1fr_40%]" : "lg:grid-cols-[40%_1fr]"}`}
      >
        {isLogin ? (
          <>
            <div className="flex flex-col bg-muted/40">
              <div className="px-8 pt-8 pb-4">
                <Link href="/" className="text-xl font-bold text-primary">
                  FitMatch
                </Link>
              </div>
              <div className="flex flex-1 items-start justify-center px-6 pt-6 pb-12">
                <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-sm border border-border">
                  {children}
                </div>
              </div>
            </div>
            {bluePanel}
          </>
        ) : (
          <>
            {bluePanel}
            <div className="flex flex-col justify-center bg-card px-8 py-10 lg:px-16">
              <div className="w-full max-w-md mx-auto">{children}</div>
            </div>
          </>
        )}
      </div>
      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        © 2024 FitMatch Marketplace. Bảo lưu mọi quyền.
      </footer>
    </div>
  );
}
