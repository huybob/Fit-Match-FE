export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const AUTH_TOKENS_KEY = "fitmatch.auth.tokens";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
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
  },

  clear() {
    getStorage()?.removeItem(AUTH_TOKENS_KEY);
  },
};
