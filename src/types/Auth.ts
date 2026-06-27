export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username?: string;
  name?: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id?: number;
  username?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
  [key: string]: unknown;
}
