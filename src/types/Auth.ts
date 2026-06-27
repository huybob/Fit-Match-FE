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

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface FitnessPreferences {
  styles?: string[];
  frequency?: string;
  equipmentAccess?: string;
  injuries?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  location?: string;
  height?: number;
  weight?: number;
  mainGoal?: string;
  emergencyContact?: EmergencyContact;
  fitnessPreferences?: FitnessPreferences;
  [key: string]: unknown;
}

export interface AuthUser {
  id?: number;
  username?: string;
  fullName?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  location?: string;
  height?: number;
  weight?: number;
  mainGoal?: string;
  emergencyContact?: EmergencyContact;
  fitnessPreferences?: FitnessPreferences;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
  [key: string]: unknown;
}
