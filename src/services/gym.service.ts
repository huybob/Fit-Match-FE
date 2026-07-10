import { api } from "@/services/api";
import type {
  BranchInput,
  BranchPage,
  BranchRequest,
  BranchResponse,
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
  GymPtPage,
  GymPtResponse,
  GymRequest,
  GymServiceInput,
  GymServiceResponse,
  GymVerificationStatusResponse,
  PartnershipActionRequest,
  PartnershipPage,
  PtCertInput,
  PtCertResponse,
  PtDocInput,
  PtDocResponse,
  PtStatusInput,
  SubmitGymRegistrationRequest,
  UpdateGymProfileInput,
  UpdateGymPtInput,
} from "@/types/Gym";
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

  // ── Operator workspace: services (UC-53..55) ──
  listOwnServices: () => api.get<GymServiceResponse[]>("/gym/services"),
  addService: (payload: GymServiceInput) =>
    api.post<GymServiceResponse, GymServiceInput>("/gym/services", payload),
  editService: (id: number, payload: GymServiceInput) =>
    api.put<GymServiceResponse, GymServiceInput>(`/gym/services/${id}`, payload),
  deactivateService: (id: number) => api.deleteRaw(`/gym/services/${id}`),

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
};
