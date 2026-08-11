import { api } from "@/services/api";
import type {
  BookingRules,
  BranchInput,
  BranchResponse,
  CatalogStatus,
  CreateGymPtInput,
  FacilityInput,
  FacilityResponse,
  GymDocumentDto,
  GymPolicy,
  GymPtPage,
  GymPtResponse,
  GymServiceInput,
  GymServiceResponse,
  GymVerificationStatusResponse,
  OperatingHour,
  PtCertInput,
  PtCertResponse,
  PtDocInput,
  PtDocResponse,
  PtStatusInput,
  SubmitGymRegistrationRequest,
  TrainingPackageInput,
  TrainingPackageResponse,
  UpdateGymProfileInput,
  UpdateGymPtInput,
} from "@/types/Gym";
import type {
  AvailabilitySlot,
  BlockedTime,
  BlockedTimeInput,
  PtAssignment,
  PtAssignmentInput,
  PtPerformance,
} from "@/types/Trainer";
import type { PaginationParams } from "@/shared/types/pagination.type";
import type { MediaImageType } from "@/types/Media";

/**
 * GymMediaResponse của BE (UC-016). Từ V64 ảnh nằm trong bảng media_assets nên
 * có thêm thumbnail/imageType/primary; các trường cũ giữ nguyên tên.
 */
export interface GymMediaItem {
  id: number;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  branchId?: number | null;
  imageType?: MediaImageType;
  sortOrder?: number;
  primary?: boolean;
}

// Phase 2 cleanup: đã xóa cụm hàm legacy gọi endpoint không tồn tại trên BE
// (/gyms, /gyms/me, /gyms/{id}/close|reopen|logo|cover, /pt/partnerships/*).
// Cluster UI chết đi kèm (gym-workspace-pages, use-gym, gym/query-keys,
// gym/schemas) từng bị sót lại và làm tsc đỏ 26 lỗi — nay đã xóa nốt.
// Chỉ giữ contract thật.

const page = { page: 0, size: 20 };

export const gymService = {
  getVerificationStatus: () =>
    api.get<GymVerificationStatusResponse>("/gym/verification-status"),

  submitRegistration: (payload: SubmitGymRegistrationRequest) =>
    api.postRaw("/gym/registration", payload),

  resubmitRegistration: (payload: SubmitGymRegistrationRequest) =>
    api.putRaw("/gym/registration/resubmit", payload),

  // ── Gym verification documents (UC-012, B-4) ──
  listDocuments: () => api.get<GymDocumentDto[]>("/gym/documents"),
  addDocument: (payload: GymDocumentDto) =>
    api.post<GymDocumentDto, GymDocumentDto>("/gym/documents", payload),
  deleteDocument: (id: number) => api.deleteRaw(`/gym/documents/${id}`),

  // ── Gym profile (UC-44, UC-018) ──
  updateProfile: (payload: UpdateGymProfileInput) =>
    api.putRaw("/gym/profile", payload),
  setVisibility: (visible: boolean) =>
    api.putRaw("/gym/profile/visibility", { visible }),

  // ── Ảnh Gym/chi nhánh (UC-016, V64) ──
  // BE tự suy ra gym từ token nên FE không cần biết gymProfileId; file đi thẳng
  // lên Google Cloud Storage qua Media system dùng chung.
  listMedia: (branchId?: number) =>
    api.get<GymMediaItem[]>("/gym/media", { params: { branchId } }),
  uploadMedia: (
    files: File[],
    options: { branchId?: number; imageType?: MediaImageType; caption?: string } = {},
    onProgress?: (percent: number) => void,
  ) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return api.post<GymMediaItem[], FormData>("/gym/media", form, {
      params: {
        branchId: options.branchId,
        imageType: options.imageType,
        caption: options.caption,
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
  },
  deleteMedia: (id: number) => api.deleteRaw(`/gym/media/${id}`),

  // ── Operator workspace: branches (UC-50..52) ──
  listOwnBranches: () => api.get<BranchResponse[]>("/gym/branches"),
  getOwnBranch: (id: number) => api.get<BranchResponse>(`/gym/branches/${id}`),
  addBranch: (payload: BranchInput) =>
    api.post<BranchResponse, BranchInput>("/gym/branches", payload),
  editBranch: (id: number, payload: BranchInput) =>
    api.put<BranchResponse, BranchInput>(`/gym/branches/${id}`, payload),
  deactivateBranch: (id: number) => api.deleteRaw(`/gym/branches/${id}`),

  // ── Operator workspace: facilities (UC-47..49) ──
  listOwnFacilities: () => api.get<FacilityResponse[]>("/gym/facilities"),
  addFacility: (payload: FacilityInput) =>
    api.post<FacilityResponse, FacilityInput>("/gym/facilities", payload),
  editFacility: (id: number, payload: FacilityInput) =>
    api.put<FacilityResponse, FacilityInput>(`/gym/facilities/${id}`, payload),
  deactivateFacility: (id: number) => api.deleteRaw(`/gym/facilities/${id}`),

  // ── Operating hours + policies (UC-017, B-11) ──
  getOperatingHours: (branchId: number) =>
    api.get<OperatingHour[]>(`/gym/branches/${branchId}/operating-hours`),
  updateOperatingHours: (branchId: number, hours: OperatingHour[]) =>
    api.put<OperatingHour[], { hours: OperatingHour[] }>(
      `/gym/branches/${branchId}/operating-hours`, { hours }),
  getPolicies: () => api.get<GymPolicy>("/gym/policies"),
  updatePolicies: (payload: GymPolicy) =>
    api.put<GymPolicy, GymPolicy>("/gym/policies", payload),

  // ── Operator workspace: services (UC-53..55) ──
  listOwnServices: () => api.get<GymServiceResponse[]>("/gym/services"),
  addService: (payload: GymServiceInput) =>
    api.post<GymServiceResponse, GymServiceInput>("/gym/services", payload),
  editService: (id: number, payload: GymServiceInput) =>
    api.put<GymServiceResponse, GymServiceInput>(`/gym/services/${id}`, payload),
  deactivateService: (id: number) => api.deleteRaw(`/gym/services/${id}`),
  /** UC-024 (BE-7): danh mục dịch vụ khả dụng cho gym (chỉ đọc, active-only). */
  listServiceCategories: () =>
    api.get<{ id?: number; name?: string; description?: string }[]>("/gym/service-categories"),
  /** UC-026 (B-23): quy tắc đặt lịch của dịch vụ. */
  updateServiceBookingRules: (id: number, payload: BookingRules) =>
    api.put<GymServiceResponse, BookingRules>(`/gym/services/${id}/booking-rules`, payload),
  /** UC-027 (B-24): publish/hide/pause/archive dịch vụ. */
  updateServiceCatalogStatus: (id: number, status: CatalogStatus) =>
    api.patch<GymServiceResponse, { status: CatalogStatus }>(
      `/gym/services/${id}/catalog-status`, { status }),

  // ── Training packages (UC-025, B-15) ──
  listOwnPackages: () => api.get<TrainingPackageResponse[]>("/gym/packages"),
  addPackage: (payload: TrainingPackageInput) =>
    api.post<TrainingPackageResponse, TrainingPackageInput>("/gym/packages", payload),
  editPackage: (id: number, payload: TrainingPackageInput) =>
    api.put<TrainingPackageResponse, TrainingPackageInput>(`/gym/packages/${id}`, payload),
  deactivatePackage: (id: number) => api.deleteRaw(`/gym/packages/${id}`),
  updatePackageBookingRules: (id: number, payload: BookingRules) =>
    api.put<TrainingPackageResponse, BookingRules>(`/gym/packages/${id}/booking-rules`, payload),
  updatePackageCatalogStatus: (id: number, status: CatalogStatus) =>
    api.patch<TrainingPackageResponse, { status: CatalogStatus }>(
      `/gym/packages/${id}/catalog-status`, { status }),

  // ── Operator workspace: PT management (UC-019..021) ──
  listPts: (params: PaginationParams = page) =>
    api.get<GymPtPage>("/gym/pts", { params }),
  getPt: (id: number) => api.get<GymPtResponse>(`/gym/pts/${id}`),
  createPt: (payload: CreateGymPtInput) =>
    api.post<GymPtResponse, CreateGymPtInput>("/gym/pts", payload),
  updatePt: (id: number, payload: UpdateGymPtInput) =>
    api.put<GymPtResponse, UpdateGymPtInput>(`/gym/pts/${id}`, payload),
  updatePtStatus: (id: number, payload: PtStatusInput) =>
    api.patch<GymPtResponse, PtStatusInput>(`/gym/pts/${id}/status`, payload),

  listPtCerts: (ptId: number) =>
    api.get<PtCertResponse[]>(`/gym/pts/${ptId}/certifications`),
  addPtCert: (ptId: number, payload: PtCertInput) =>
    api.post<PtCertResponse, PtCertInput>(`/gym/pts/${ptId}/certifications`, payload),
  updatePtCert: (ptId: number, certId: number, payload: PtCertInput) =>
    api.put<PtCertResponse, PtCertInput>(`/gym/pts/${ptId}/certifications/${certId}`, payload),
  deletePtCert: (ptId: number, certId: number) =>
    api.deleteRaw(`/gym/pts/${ptId}/certifications/${certId}`),

  listPtDocs: (ptId: number) =>
    api.get<PtDocResponse[]>(`/gym/pts/${ptId}/documents`),
  addPtDoc: (ptId: number, payload: PtDocInput) =>
    api.post<PtDocResponse, PtDocInput>(`/gym/pts/${ptId}/documents`, payload),
  deletePtDoc: (ptId: number, docId: number) =>
    api.deleteRaw(`/gym/pts/${ptId}/documents/${docId}`),

  // ── Gói 2.D (audit 2026-07-17): các endpoint BE sẵn có nhưng FE = 0 caller ──
  /** UC-028 (B-27): gym quản lý lịch rảnh của PT (dayOfWeek 1-7, replace-all). */
  getPtAvailability: (ptId: number) =>
    api.get<AvailabilitySlot[]>(`/gym/pts/${ptId}/availability`),
  updatePtAvailability: (ptId: number, slots: AvailabilitySlot[]) =>
    api.put<AvailabilitySlot[], { slots: AvailabilitySlot[] }>(
      `/gym/pts/${ptId}/availability`, { slots }),

  /** UC-022 (B-16): phân công PT vào đúng-một-trong branch/service/package. */
  listPtAssignments: (ptId: number) =>
    api.get<PtAssignment[]>(`/gym/pts/${ptId}/assignments`),
  addPtAssignment: (ptId: number, payload: PtAssignmentInput) =>
    api.post<PtAssignment, PtAssignmentInput>(`/gym/pts/${ptId}/assignments`, payload),
  removePtAssignment: (ptId: number, assignmentId: number) =>
    api.deleteRaw(`/gym/pts/${ptId}/assignments/${assignmentId}`),

  /** UC-023 (B-17): hiệu suất PT — rating, completed/cancelled/no-show, disputes. */
  getPtPerformance: (ptId: number) =>
    api.get<PtPerformance>(`/gym/pts/${ptId}/performance`),

  /** UC-029 (B-29): thời gian chặn của gym (theo PT hoặc chi nhánh). */
  listBlockedTimes: (params: { ptId?: number; branchId?: number }) =>
    api.get<BlockedTime[]>("/gym/blocked-times", { params }),
  createBlockedTime: (payload: BlockedTimeInput) =>
    api.post<BlockedTime, BlockedTimeInput>("/gym/blocked-times", payload),
  deleteBlockedTime: (id: number) =>
    api.deleteRaw(`/gym/blocked-times/${id}`),
};
