"use client";

// F-30 (audit 2026-07-17): 3 workspace (gym/trainer/admin) trước đây sidebar cố định
// chiếm trọn màn hình mobile, không có hamburger. Wrapper này: desktop giữ nguyên,
// mobile ẩn sidebar + nút nổi mở drawer overlay (bấm link nào cũng tự đóng).

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

export function ResponsiveSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: sidebar cố định như cũ */}
      <div className="hidden lg:block">{children}</div>

      {/* Mobile: nút nổi mở menu */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở menu"
        className="fixed bottom-4 left-4 z-40 grid size-12 place-items-center rounded-full bg-primary text-white shadow-lg shadow-blue-500/30 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          {/* Bấm bất kỳ mục nào trong drawer (link/logout) -> đóng */}
          <div className="absolute inset-y-0 left-0 shadow-2xl" onClick={() => setOpen(false)}>
            {children}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-card text-foreground shadow-lg"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}
