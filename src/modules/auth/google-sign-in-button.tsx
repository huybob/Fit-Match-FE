"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/core/config/env";
import { useToast } from "@/lib/toast-provider";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { AuthUser } from "@/services/auth.service";
import { useGoogleIdentity } from "@/shared/hooks/use-google-identity";
import { getErrorCode, toErrorMessage } from "@/shared/utils/error.util";

/** Google chặn chiều rộng nút ở 400px. */
const MAX_BUTTON_WIDTH = 400;
const FALLBACK_BUTTON_WIDTH = 320;

interface GoogleSignInButtonProps {
  /** Nhãn trên nút của Google — "Đăng nhập với" ở trang login, "Đăng ký với" ở trang register. */
  text?: "signin_with" | "signup_with" | "continue_with";
  onSuccess: (user: AuthUser) => void;
}

/**
 * UC-003: nút đăng nhập bằng Google (Google Identity Services).
 *
 * Dùng đúng nút do Google vẽ (renderButton) thay vì nút tự thiết kế: đây là cách
 * duy nhất lấy được ID token mà vẫn tuân thủ yêu cầu nhận diện thương hiệu của
 * Google, đồng thời tự lo phần chọn tài khoản/đa ngôn ngữ.
 *
 * Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID (hoặc script Google bị chặn) thì
 * component tự ẩn — form đăng nhập bằng mật khẩu không bị ảnh hưởng.
 */
export function GoogleSignInButton({ text = "signin_with", onSuccess }: GoogleSignInButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { toast } = useToast();
  const { status, identity } = useGoogleIdentity();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [pending, setPending] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const handleCredential = useCallback(
    async (credential: string) => {
      setPending(true);
      try {
        onSuccess(await loginWithGoogle(credential));
      } catch (error) {
        const code = getErrorCode(error);
        const unavailable = code === "GOOGLE_AUTH_DISABLED" || code === "GOOGLE_AUTH_UNAVAILABLE";
        toast({
          type: "error",
          title: unavailable ? t("auth.googleUnavailable") : t("auth.googleFailed"),
          description: toErrorMessage(error),
        });
      } finally {
        setPending(false);
      }
    },
    [loginWithGoogle, onSuccess, t, toast],
  );

  // Google "chốt" callback ngay lúc initialize — giữ trong ref để mỗi lần bấm đều
  // chạy bản mới nhất mà không phải initialize lại và vẽ lại nút.
  const handlerRef = useRef(handleCredential);
  useEffect(() => {
    handlerRef.current = handleCredential;
  }, [handleCredential]);

  useEffect(() => {
    if (status !== "ready" || !identity) return;
    const host = hostRef.current;
    const target = targetRef.current;
    if (!host || !target) return;

    identity.initialize({
      client_id: env.googleClientId,
      callback: (response) => {
        if (response.credential) handlerRef.current(response.credential);
      },
      // Không tự đăng nhập lại tài khoản đã chọn lần trước: người dùng vừa đăng xuất
      // mà bị đẩy vào lại phiên cũ là hành vi khó hiểu.
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const render = () => {
      // renderButton NỐI THÊM iframe chứ không thay thế -> phải dọn trước, nếu không
      // mỗi lần vẽ lại là thêm một nút nữa chồng lên.
      target.replaceChildren();
      identity.renderButton(target, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        logo_alignment: "center",
        text,
        locale,
        width: Math.min(MAX_BUTTON_WIDTH, Math.round(host.clientWidth) || FALLBACK_BUTTON_WIDTH),
      });
    };
    render();

    // Nút của Google chỉ nhận width tính bằng px nên phải vẽ lại khi khung đổi kích
    // thước (xoay máy, đổi bố cục). Quan sát khung NGOÀI — quan sát đúng chỗ vẽ thì
    // chính việc vẽ lại sẽ kích hoạt observer thành vòng lặp vô tận.
    const observer = new ResizeObserver(render);
    observer.observe(host);
    return () => observer.disconnect();
  }, [status, identity, text, locale]);

  // Fail-soft: chưa cấu hình client id, hoặc script Google bị chặn (adblock/mạng) —
  // ẩn hẳn khối này thay vì để một ô trống không bấm được.
  if (status === "disabled" || status === "error") return null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          {/* bg-card khớp nền thẻ của AuthPageShell (login) và panel đăng ký. */}
          <span className="bg-card px-3 text-xs text-muted-foreground">
            {t("auth.orContinueWith")}
          </span>
        </div>
      </div>

      <div
        ref={hostRef}
        aria-busy={pending}
        className={pending ? "pointer-events-none opacity-60" : undefined}
      >
        {/* Chiều cao cố định bằng nút "large" của Google: giữ chỗ sẵn để bố cục
            không nhảy một nhịp lúc script vừa nạp xong. */}
        <div ref={targetRef} className="flex min-h-10 justify-center" />
      </div>
    </div>
  );
}
