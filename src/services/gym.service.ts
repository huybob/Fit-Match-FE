import { api } from "@/services/api";
import type {
  BookingRules,
  BranchInput,
  BranchPage,
  BranchRequest,
  BranchResponse,
  CatalogStatus,
  CreateGymPtInput,
  FacilityInput,
  FacilityPage,
  FacilityRequest,
  FacilityResponse,
  Gym,
  GymBranch,
  GymDocumentDto,
  GymFacility,
  GymPage,
  GymPartnership,
  GymPolicy,
  GymPtPage,
  GymPtResponse,
  GymRequest,
  GymServiceInput,
  GymServiceResponse,
  GymVerificationStatusResponse,
  OperatingHour,
  PartnershipActionRequest,
  PartnershipPage,
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

export type {
  BranchInput,
  BranchPage,
  BranchRequest,
  BranchResponse,
  FacilityInput,
  FacilityPage,
  FacilityRequest,
  FacilityResponse,
  Gym,
  GymBranch,
  GymDocumentDto,
  GymFacility,
  GymPage,
  GymPartnership,
  GymRequest,
  GymServiceInput,
  GymServiceResponse,
  GymVerificationStatusResponse,
  PartnershipActionRequest,
  PartnershipPage,
  SubmitGymRegistrationRequest,
} from "@/types/Gym";

export type GymSearchParams = Partial<PaginationParams> & {
  city?: string;
  district?: string;
  minRating?: number;
  facilityType?: string;
  keyword?: string;
};

const page = { page: 0, size: 20 };
function upload(file: File) {
  const form = new FormData();
  form.append("file", file);
  return form;
}

export const gymService = {
  async search(params: GymSearchParams = {}) {
    return api.get<GymPage>("/gyms", { params: { ...page, ...params } });
  },
  async getDetail(id: number) {
    return api.get<Gym>(`/gyms/${id}`);
  },
  async getMine(params: PaginationParams = page) {
    return api.get<GymPage>("/gyms/me", { params });
  },
  async create(payload: GymRequest) {
    return api.post<Gym, GymRequest>("/gyms", payload);
  },
  async update(id: number, payload: GymRequest) {
    return api.put<Gym, GymRequest>(`/gyms/${id}`, payload);
  },
  async close(id: number) {
    await api.putRaw(`/gyms/${id}/close`);
  },
  async reopen(id: number) {
    await api.putRaw(`/gyms/${id}/reopen`);
  },
  async uploadLogo(id: number, file: File) {
    return api.post<Gym, FormData>(`/gyms/${id}/logo`, upload(file));
  },
  async uploadCover(id: number, file: File) {
    return api.post<Gym, FormData>(`/gyms/${id}/cover`, upload(file));
  },
  async getBranches(gymId: number, params: PaginationParams = page) {
    return api.get<BranchPage>(`/gyms/${gymId}/branches`, { params });
  },
  async createBranch(gymId: number, payload: BranchRequest) {
    return api.post<GymBranch, BranchRequest>(
      `/gyms/${gymId}/branches`,
      payload,
    );
  },
  async updateBranch(gymId: number, id: number, payload: BranchRequest) {
    return api.put<GymBranch, BranchRequest>(
      `/gyms/${gymId}/branches/${id}`,
      payload,
    );
  },
  async deleteBranch(gymId: number, id: number) {
    await api.deleteRaw(`/gyms/${gymId}/branches/${id}`);
  },
  async getFacilities(gymId: number, params: PaginationParams = page) {
    return api.get<FacilityPage>(`/gyms/${gymId}/facilities`, { params });
  },
  async createFacility(gymId: number, payload: FacilityRequest) {
    return api.post<GymFacility, FacilityRequest>(
      `/gyms/${gymId}/facilities`,
      payload,
    );
  },
  async updateFacility(gymId: number, id: number, payload: FacilityRequest) {
    return api.put<GymFacility, FacilityRequest>(
      `/gyms/${gymId}/facilities/${id}`,
      payload,
    );
  },
  async deleteFacility(gymId: number, id: number) {
    await api.deleteRaw(`/gyms/${gymId}/facilities/${id}`);
  },
  async getPartnerships(status?: string) {
    return api.get<PartnershipPage>("/pt/partnerships/me", {
      params: { ...page, status },
    });
  },
  async approvePartnership(id: number, payload: PartnershipActionRequest) {
    return api.put<GymPartnership, PartnershipActionRequest>(
      `/pt/partnerships/${id}/approve`,
      payload,
    );
  },
  async rejectPartnership(id: number, payload: PartnershipActionRequest) {
    return api.put<GymPartnership, PartnershipActionRequest>(
      `/pt/partnerships/${id}/reject`,
      payload,
    );
  },
  async endPartnership(id: number) {
    return api.put<GymPartnership>(`/pt/partnerships/${id}/end`);
  },

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
