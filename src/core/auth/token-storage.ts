export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const AUTH_TOKENS_KEY = "fitmatch.auth.tokens";

/**
 * F-5 (audit 2026-07-17): cờ phiên dạng cookie (không chứa token) để middleware.ts
 * chặn server-side các route cần đăng nhập — token thật vẫn ở localStorage nên
 * middleware chỉ kiểm tra "có phiên hay không", không kiểm tra role (AuthGuard + BE lo).
 */
export const SESSION_FLAG_COOKIE = "fitmatch.session";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function setSessionFlag(present: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = present
    ? `${SESSION_FLAG_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${SESSION_FLAG_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export const tokenStorage = {
  get(): AuthTokens | null {
    const value = getStorage()?.getItem(AUTH_TOKENS_KEY);
    if (!value) return null;

    try {
      const tokens = JSON.parse(value) as Partial<AuthTokens>;
      if (!tokens.accessToken || !tokens.refreshToken || !tokens.expiresAt) {
        this.clear();
        return null;
      }
      return tokens as AuthTokens;
    } catch {
      this.clear();
      return null;
    }
  },

  set(tokens: AuthTokens) {
    getStorage()?.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
    setSessionFlag(true);
  },

  clear() {
    getStorage()?.removeItem(AUTH_TOKENS_KEY);
    setSessionFlag(false);
  },
};
