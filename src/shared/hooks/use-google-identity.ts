"use client";

import { useEffect, useState } from "react";
import { env } from "@/core/config/env";

export type GoogleIdentityStatus = "disabled" | "loading" | "ready" | "error";

/** Kết quả Google trả về sau khi người dùng chọn tài khoản. */
export interface GoogleCredentialResponse {
  /** ID token (JWT) — thứ duy nhất gửi cho BE; BE tự đọc email/tên từ đây. */
  credential?: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  /** Chiều rộng tính bằng px; Google chặn ở 400px. */
  width?: number;
  locale?: string;
}

/** Phần `google.accounts.id` của Google Identity Services. */
export interface GoogleIdentity {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
  disableAutoSelect: () => void;
  cancel: () => void;
}

const SCRIPT_ID = "google-identity-services";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Đọc `window.google.accounts.id` qua ép kiểu thay vì mở rộng global namespace.
 *
 * V65: trước đây `window.google` được @types/google.maps khai báo sẵn, nhưng gói
 * đó đã bị gỡ cùng Google Maps JavaScript API. Đăng nhập Google (UC-003) không
 * liên quan tới bản đồ và vẫn chạy — nó chỉ cần script gsi/client, không cần
 * kiểu toàn cục nào.
 */
function readIdentity(): GoogleIdentity | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
}

/** Promise dùng chung: trang login và trang đăng ký cùng cần script này. */
let loaderPromise: Promise<GoogleIdentity> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const loaded = readIdentity();
  if (loaded) return Promise.resolve(loaded);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      const identity = readIdentity();
      if (identity) resolve(identity);
      else reject(new Error("Google Identity Services loaded without an accounts.id namespace"));
    };
    const onError = () => reject(new Error("Failed to load the Google Identity Services script"));

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  // Lỗi phải xoá cache promise, nếu không mọi lần thử lại đều nhận lại đúng lỗi cũ.
  loaderPromise.catch(() => {
    loaderPromise = null;
  });
  return loaderPromise;
}

/**
 * Nạp Google Identity Services (UC-003 — đăng nhập bằng Google).
 *
 * Không cấu hình `NEXT_PUBLIC_GOOGLE_CLIENT_ID` thì trả `disabled` thay vì lỗi:
 * form đăng nhập bằng mật khẩu vẫn chạy bình thường, chỉ là không có nút Google.
 */
export function useGoogleIdentity(): { status: GoogleIdentityStatus; identity: GoogleIdentity | null } {
  const enabled = Boolean(env.googleClientId);
  const [identity, setIdentity] = useState<GoogleIdentity | null>(null);
  const [status, setStatus] = useState<GoogleIdentityStatus>(enabled ? "loading" : "disabled");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadGoogleIdentity()
      .then((namespace) => {
        if (!active) return;
        setIdentity(namespace);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { status, identity };
}
