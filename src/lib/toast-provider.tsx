"use client";

import { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { Toaster } from "@/shared/components/ui/sonner";

type ToastType = "success" | "error" | "warning" | "info" | "loading";
type ToastInput = {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors closeButton />
    </>
  );
}

export function useToast() {
  /**
   * BUG-05: KHÔNG tự sinh `id` truyền vào Sonner.
   *
   * Trước đây mỗi lần gọi truyền `id: String(Date.now())`. Với Sonner, một `id`
   * do caller cung cấp nghĩa là "cập nhật toast có id này"; StrictMode (dev) chạy
   * handler hai lần trong cùng một mili-giây nên hai lần gọi ra CÙNG một id —
   * lần sau ghi đè rồi kết thúc vòng đời của lần trước, toast vừa hiện đã biến
   * mất trong cùng một frame. Hệ quả: KHÔNG toast nào hiển thị ở bất kỳ đâu
   * trong app, cả báo lỗi lẫn báo thành công.
   *
   * Sonner tự sinh id duy nhất và trả về — dùng đúng giá trị đó cho `dismiss`.
   */
  const toast = (input: ToastInput): string => {
    const opts = {
      description: input.description,
      duration: input.type === "loading" ? Infinity : (input.duration ?? 4200),
    };
    switch (input.type) {
      case "success":
        return String(sonnerToast.success(input.title, opts));
      case "error":
        return String(sonnerToast.error(input.title, opts));
      case "warning":
        return String(sonnerToast.warning(input.title, opts));
      case "loading":
        return String(sonnerToast.loading(input.title, opts));
      default:
        return String(sonnerToast.info(input.title, opts));
    }
  };

  const dismiss = (id: string) => sonnerToast.dismiss(id);

  return { toast, dismiss };
}
