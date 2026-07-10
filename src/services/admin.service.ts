import { api } from "@/services/api";
import type {
  AdminUserPage,
  AdminUserResponse,
  AssignRoleRequest,
  AuditLogPage,
  GymVerificationPage,
  GymVerificationResponse,
  PtDocumentDto,
  ServiceCategoryRequest,
  ServiceCategoryResponse,
  SystemConfigRequest,
  SystemConfigResponse,
  PtVerificationPage,
  PtVerificationResponse,
  RejectRequest,
  UpdateUserStatusRequest,
  UserRole,
  UserStatus,
} from "@/types/Admin";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type { AdminUserResponse, AdminUserPage, AuditLogPage, UserStatus, UserRole, PtVerificationResponse, PtVerificationPage, PtDocumentDto, GymVerificationResponse, GymVerificationPage };

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

  listGymVerifications: (params: PaginationParams & { status?: string }) =>
    api.get<GymVerificationPage>("/admin/gym-verifications", { params }),

  getGymVerification: (id: number) =>
    api.get<GymVerificationResponse>(`/admin/gym-verifications/${id}`),

  approveGymVerification: (id: number) =>
    api.postRaw(`/admin/gym-verifications/${id}/approve`),

  rejectGymVerification: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/gym-verifications/${id}/reject`, payload),

  suspendGymVerification: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/gym-verifications/${id}/suspend`, payload),

  reactivateGymVerification: (id: number) =>
    api.postRaw(`/admin/gym-verifications/${id}/reactivate`),

  requestGymInfo: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/gym-verifications/${id}/request-info`, payload),

  // ── Admin PT management (UC-021) ──
  suspendPt: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/pts/${id}/suspend`, payload),

  reactivatePt: (id: number) =>
    api.postRaw(`/admin/pts/${id}/reactivate`),

  // ── Master data (UC-078) ──
  listServiceCategories: () =>
    api.get<ServiceCategoryResponse[]>("/admin/master-data/service-categories"),
  createServiceCategory: (payload: ServiceCategoryRequest) =>
    api.post<ServiceCategoryResponse, ServiceCategoryRequest>("/admin/master-data/service-categories", payload),
  updateServiceCategory: (id: number, payload: ServiceCategoryRequest) =>
    api.put<ServiceCategoryResponse, ServiceCategoryRequest>(`/admin/master-data/service-categories/${id}`, payload),
  listSystemConfigs: () =>
    api.get<SystemConfigResponse[]>("/admin/master-data/system-configs"),
  upsertSystemConfig: (payload: SystemConfigRequest) =>
    api.put<SystemConfigResponse, SystemConfigRequest>("/admin/master-data/system-configs", payload),
};
