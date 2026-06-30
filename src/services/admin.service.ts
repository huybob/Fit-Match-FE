import { api } from "@/services/api";
import type {
  AdminUserPage,
  AdminUserResponse,
  AssignRoleRequest,
  AuditLogPage,
  PtDocumentDto,
  PtVerificationPage,
  PtVerificationResponse,
  RejectRequest,
  UpdateUserStatusRequest,
  UserRole,
  UserStatus,
} from "@/types/Admin";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type { AdminUserResponse, AdminUserPage, AuditLogPage, UserStatus, UserRole, PtVerificationResponse, PtVerificationPage, PtDocumentDto };

export interface AdminUserSearchParams extends PaginationParams {
  keyword?: string;
  role?: string;
  status?: string;
}

export const adminService = {
  searchUsers: (params: AdminUserSearchParams) =>
    api.get<AdminUserPage>("/admin/users", { params }),

  getUserById: (id: number) =>
    api.get<AdminUserResponse>(`/admin/users/${id}`),

  updateStatus: (id: number, payload: UpdateUserStatusRequest) =>
    api.patch<AdminUserResponse, UpdateUserStatusRequest>(`/admin/users/${id}/status`, payload),

  assignRole: (id: number, payload: AssignRoleRequest) =>
    api.patch<AdminUserResponse, AssignRoleRequest>(`/admin/users/${id}/role`, payload),

  getAuditLogs: (params: PaginationParams & { action?: string; targetType?: string; actor?: string; from?: string; to?: string }) =>
    api.get<AuditLogPage>("/admin/audit-logs", { params }),

  listPtVerifications: (params: PaginationParams & { status?: string }) =>
    api.get<PtVerificationPage>("/admin/pt-verifications", { params }),

  getPtVerification: (id: number) =>
    api.get<PtVerificationResponse>(`/admin/pt-verifications/${id}`),

  approvePtVerification: (id: number) =>
    api.postRaw(`/admin/pt-verifications/${id}/approve`),

  rejectPtVerification: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/pt-verifications/${id}/reject`, payload),
};
