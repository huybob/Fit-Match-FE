import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";

export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type RefreshTokenRequest = components["schemas"]["RefreshTokenRequest"];
export type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];
export type AuthResponse = components["schemas"]["AuthResponse"];
export type AuthUser = components["schemas"]["UserResponse"];
type ApiAuthResponse = components["schemas"]["ApiResponseAuthResponse"];
type ApiUserResponse = components["schemas"]["ApiResponseUserResponse"];

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiAuthResponse>("/auth/login", payload);
    return unwrapApiData(response.data);
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiAuthResponse>("/auth/register", payload);
    return unwrapApiData(response.data);
  },

  async getProfile(): Promise<AuthUser> {
    const response = await axiosClient.get<ApiUserResponse>("/user/profile");
    return unwrapApiData(response.data);
  },

  async logout(): Promise<void> {
    await axiosClient.post("/auth/logout");
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await axiosClient.put("/auth/change-password", payload);
  },
};
