import type { PageResponse } from "@/shared/types/api-response.type";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";
export type UserRole =
  | "ROLE_CUSTOMER"
  | "ROLE_PT"
  | "ROLE_GYM_OPERATOR"
  | "ROLE_ADMIN"
  | "ROLE_MODERATOR"
  | "ROLE_FINANCE_ADMIN";

export interface AdminUserResponse {
  id?: number;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  location?: string;
  avatarUrl?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  height?: number;
  weight?: number;
  mainGoal?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface AssignRoleRequest {
  role: UserRole;
}

export interface AuditLogResponse {
  id?: number;
  action?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  actor?: string;
  timestamp?: string;
}

export type AdminUserPage = PageResponse<AdminUserResponse>;
export type AuditLogPage = PageResponse<AuditLogResponse>;

export type PtVerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REQUIRES_INFO"
  | "SUSPENDED";

export interface PtDocumentDto {
  documentType: string;
  fileUrl: string;
}

export interface PtVerificationResponse {
  id?: number;
  username?: string;
  displayName?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  verificationStatus?: PtVerificationStatus;
  rejectionReason?: string;
  active?: boolean;
  /** Bug 14: trạng thái vận hành thật của PT (UC-019/021) — ACTIVE | INACTIVE | SUSPENDED. */
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  documents?: PtDocumentDto[];
  email?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface RejectRequest {
  reason: string;
}

export type PtVerificationPage = PageResponse<PtVerificationResponse>;

export interface GymVerificationResponse {
  id?: number;
  username?: string;
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  verificationStatus?: PtVerificationStatus;
  rejectionReason?: string;
  /** B-10: ghi chú admin khi request-info/suspend (BE GymProfileResponse.reviewNote). */
  reviewNote?: string;
  active?: boolean;
  documents?: PtDocumentDto[];
}

export type GymVerificationPage = PageResponse<GymVerificationResponse>;

// ── Master data (UC-078) ──
export interface ServiceCategoryResponse {
  id?: number;
  name?: string;
  description?: string;
  active?: boolean;
}
export interface ServiceCategoryRequest {
  name: string;
  description?: string;
  active?: boolean;
}
