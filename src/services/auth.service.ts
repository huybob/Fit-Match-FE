import { api } from "@/services/api";
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from "@/types/Auth";

export type {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from "@/types/Auth";

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse, LoginRequest>("/auth/login", payload);
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    return api.post<AuthResponse, RegisterRequest>("/auth/register", payload);
  },

  async verifyEmail(token: string): Promise<void> {
    await api.postRaw("/auth/verify-email", { token });
  },

  async resendVerification(email: string): Promise<void> {
    await api.postRaw("/auth/resend-verification", { email });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.postRaw("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.postRaw("/auth/reset-password", { token, newPassword });
  },

  async getProfile(): Promise<AuthUser> {
    return api.get<AuthUser>("/user/profile");
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<AuthUser> {
    return api.put<AuthUser, UpdateProfileRequest>("/user/profile", payload);
  },

  async logout(): Promise<void> {
    await api.postRaw("/auth/logout");
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await api.putRaw("/auth/change-password", payload);
  },
};
