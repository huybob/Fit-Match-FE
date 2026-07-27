"use client";

// F-30 (audit 2026-07-17): 3 workspace (gym/trainer/admin) trước đây sidebar cố định
// chiếm trọn màn hình mobile, không có hamburger. Wrapper này: desktop giữ nguyên,
// mobile ẩn sidebar + nút nổi mở drawer overlay (bấm link nào cũng tự đóng).

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";

export function ResponsiveSidebar({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: sidebar cố định như cũ */}
      <div className="hidden lg:block">{children}</div>

      {/*
       * Mobile: drawer dựng trên Radix Dialog để có sẵn Escape, bẫy focus, trả
       * focus về nút mở và khoá cuộn trang — bản tự dựng trước đây thiếu cả bốn.
       */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <IconButton
            tooltip={t("site.menuButton")}
            variant="default"
            className="fixed bottom-4 left-4 z-40 size-12 rounded-full shadow-lg shadow-primary/30 lg:hidden"
          >
            <Menu className="size-5" />
          </IconButton>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
          <Dialog.Content
            aria-label={t("site.menuButton")}
            className="fixed inset-y-0 left-0 z-50 shadow-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden"
          >
            {/* Bấm bất kỳ mục nào trong drawer (link/logout) -> đóng */}
            <div onClick={() => setOpen(false)}>{children}</div>
            <Dialog.Close asChild>
              <IconButton
                tooltip={t("common.actions.close")}
                variant="outline"
                className="absolute right-4 top-4 size-10 rounded-full shadow-lg"
              >
                <X className="size-5" />
              </IconButton>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
