"use client";

import { create } from "zustand";
import { tokenStorage } from "@/core/auth/token-storage";
import { authService, AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "@/services/auth.service";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearSession: () => void;
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

export const useAuthStore = create<AuthState>((set) => ({
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
    set({ status: "loading" });
    try {
      saveAuthTokens(await authService.login(payload));
      const user = await authService.getProfile();
      set({ user, status: "authenticated" });
      return user;
    } catch (error) {
      tokenStorage.clear();
      set({ user: null, status: "unauthenticated" });
      throw error;
    }
  },

  register: async (payload) => {
    set({ status: "loading" });
    try {
      saveAuthTokens(await authService.register(payload));
      const user = await authService.getProfile();
      set({ user, status: "authenticated" });
      return user;
    } catch (error) {
      tokenStorage.clear();
      set({ user: null, status: "unauthenticated" });
      throw error;
    }
  },

  logout: async () => {
    try {
      if (tokenStorage.get()) await authService.logout();
    } finally {
      tokenStorage.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  clearSession: () => {
    tokenStorage.clear();
    set({ user: null, status: "unauthenticated" });
  },
}));
