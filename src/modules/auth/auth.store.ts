"use client";

import { create } from "zustand";
import { tokenStorage } from "@/core/auth/token-storage";
import { queryClient } from "@/core/providers/query-client";
import { authService, AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "@/services/auth.service";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  updateUser: (user: AuthUser) => void;
}

function saveAuthTokens(response: AuthResponse) {
  if (!response.accessToken || !response.refreshToken) {
    throw new Error("Authentication response does not contain tokens");
  }

  tokenStorage.set({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + (response.expiresIn ?? 0),
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",

  initialize: async () => {
    if (!tokenStorage.get()) {
      set({ user: null, status: "unauthenticated" });
      return;
    }

    set({ status: "loading" });
    try {
      const user = await authService.getProfile();
      set({ user, status: "authenticated" });
    } catch {
      tokenStorage.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (payload) => {
    // KHÔNG đặt status="loading" ở đây: GuestGuard che toàn màn hình bằng spinner
    // khi status là loading, nên form đăng nhập bị unmount ngay lúc bấm nút — sai
    // mật khẩu là màn hình nháy một cái và mất sạch username/password vừa gõ.
    // Trạng thái "đang gửi" đã có sẵn ở nút bấm (form.formState.isSubmitting);
    // "loading" chỉ dành cho lúc khôi phục phiên (initialize).
    try {
      saveAuthTokens(await authService.login(payload));
      const user = await authService.getProfile();
      set({ user, status: "authenticated" });
      return user;
    } catch (error) {
      tokenStorage.clear();
      // Chỉ ghi state khi thật sự đổi — tránh re-render thừa cả cây auth.
      if (get().user || get().status !== "unauthenticated") {
        set({ user: null, status: "unauthenticated" });
      }
      throw error;
    }
  },

  // UC-003: cùng hậu xử lý với login() — chỉ khác ở chỗ danh tính đến từ ID token
  // của Google thay vì username/password.
  loginWithGoogle: async (idToken) => {
    try {
      saveAuthTokens(await authService.loginWithGoogle(idToken));
      const user = await authService.getProfile();
      set({ user, status: "authenticated" });
      return user;
    } catch (error) {
      tokenStorage.clear();
      if (get().user || get().status !== "unauthenticated") {
        set({ user: null, status: "unauthenticated" });
      }
      throw error;
    }
  },

  register: async (payload) => {
    try {
      await authService.register(payload);
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      if (tokenStorage.get()) await authService.logout();
    } finally {
      tokenStorage.clear();
      // F-6: xóa cache React Query — tránh user kế tiếp trên cùng tab thấy dữ liệu user cũ.
      queryClient.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  clearSession: () => {
    tokenStorage.clear();
    queryClient.clear();
    set({ user: null, status: "unauthenticated" });
  },

  updateUser: (user) => set({ user }),
}));
