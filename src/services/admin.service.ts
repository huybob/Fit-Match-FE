import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";
import type {
  AdminUserPage,
  AdminUserResponse,
  AssignRoleRequest,
  AuditLogPage,
  GeocodingBackfillResult,
  GeocodingCoverage,
  GymVerificationPage,
  GymVerificationResponse,
  PtDocumentDto,
  ServiceCategoryRequest,
  ServiceCategoryResponse,
  PtVerificationPage,
  PtVerificationResponse,
  RejectRequest,
  UpdateUserStatusRequest,
  UserRole,
  UserStatus,
} from "@/types/Admin";
import type { PaginationParams } from "@/shared/types/pagination.type";
import type {
  PaymentTransaction,
  PaymentTxnAnomaly,
  ReconciliationApplyRequest,
  ReconciliationResolveRequest,
  ReconciliationSummary,
} from "@/types/Payment";

export type { AdminUserResponse, AdminUserPage, AuditLogPage, UserStatus, UserRole, PtVerificationResponse, PtVerificationPage, PtDocumentDto, GymVerificationResponse, GymVerificationPage };

export interface AdminUserSearchParams extends PaginationParams {
  keyword?: string;
  role?: string;
  status?: string;
}

/** UC-072 (E-2): cấu hình kinh tế marketplace — mỗi lần lưu BE insert bản ghi mới (giữ lịch sử). */
export interface CommissionConfig {
  id?: number;
  commissionPercent: number;
  platformFeePercent: number;
  settlementHoldDays: number;
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

  /**
   * Bug S2-01: địa chỉ không đúng chuẩn -> yêu cầu gym xác minh lại. KHÔNG đổi
   * trạng thái duyệt và không ẩn gym khỏi marketplace, chỉ gắn cờ + gửi thông báo.
   */
  requestGymAddressRecheck: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/gym-verifications/${id}/request-address-recheck`, payload),

  // ── Admin PT management (UC-021) ──
  suspendPt: (id: number, payload: RejectRequest) =>
    api.postRaw(`/admin/pts/${id}/suspend`, payload),

  reactivatePt: (id: number) =>
    api.postRaw(`/admin/pts/${id}/reactivate`),

  // ── Admin bookings (UC-036/040/045/050) ──
  // Nhóm /admin/bookings đã bỏ cùng mô hình booking — tra cứu vé nay ở
  // /admin/tickets và duyệt hoàn ở /admin/ticket-refunds (ticket.service.ts).

  // Duyệt hoàn tiền đã chuyển sang /admin/ticket-refunds: admin chọn FULL
  // hoặc PARTIAL_ELAPSED thay vì gõ số tiền (câu 11) — xem ticket.service.ts.

  // ── Đối soát thanh toán (UC-053/056) ──
  // Tiền vào tài khoản nền tảng nhưng không khớp booking (sai nội dung CK,
  // thiếu/thừa tiền, vào sau khi đơn hết hạn, CK trùng) trước đây chỉ nằm ở
  // log BE; giờ là hàng đợi Finance xử lý được.
  listPaymentTransactions: (
    params: PaginationParams & { reconStatus?: string; anomaly?: PaymentTxnAnomaly },
  ) => api.get<PageResponse<PaymentTransaction>>("/admin/payments/reconciliation", { params }),
  getReconciliationSummary: () =>
    api.get<ReconciliationSummary>("/admin/payments/reconciliation/summary"),
  applyPaymentTransaction: (id: number, payload: ReconciliationApplyRequest) =>
    api.post<PaymentTransaction, ReconciliationApplyRequest>(
      `/admin/payments/reconciliation/${id}/apply`, payload),
  resolvePaymentTransaction: (id: number, payload: ReconciliationResolveRequest) =>
    api.post<PaymentTransaction, ReconciliationResolveRequest>(
      `/admin/payments/reconciliation/${id}/resolve`, payload),

  // ── Commission config (UC-072, E-2) ──
  getCommissionConfig: () =>
    api.get<CommissionConfig>("/admin/commission-config"),
  updateCommissionConfig: (payload: CommissionConfig) =>
    api.put<CommissionConfig, CommissionConfig>("/admin/commission-config", payload),

  // ── Admin wallets (UC-060, D-4) ──
  freezeWallet: (gymProfileId: number, payload: { amount: number; reason: string }) =>
    api.postRaw(`/admin/wallets/${gymProfileId}/freeze`, payload),
  unfreezeWallet: (gymProfileId: number, payload: { amount: number; reason: string }) =>
    api.postRaw(`/admin/wallets/${gymProfileId}/unfreeze`, payload),

  // ── Master data (UC-078) ──
  listServiceCategories: () =>
    api.get<ServiceCategoryResponse[]>("/admin/master-data/service-categories"),
  createServiceCategory: (payload: ServiceCategoryRequest) =>
    api.post<ServiceCategoryResponse, ServiceCategoryRequest>("/admin/master-data/service-categories", payload),
  updateServiceCategory: (id: number, payload: ServiceCategoryRequest) =>
    api.put<ServiceCategoryResponse, ServiceCategoryRequest>(`/admin/master-data/service-categories/${id}`, payload),
  // E-8 (quyết định 2026-07-17): system-configs đã gỡ ở BE (V40).

  // ── Geocoding (UC-18, V59/V60) ──
  getGeocodingCoverage: () =>
    api.get<GeocodingCoverage>("/admin/geocoding/coverage"),
  runGeocodingBackfill: (limit: number) =>
    api.post<GeocodingBackfillResult>("/admin/geocoding/backfill", undefined, { params: { limit } }),
};
