import { api } from "@/services/api";
import type {
  Availability,
  AvailabilityPage,
  AvailabilityRequest,
  Certificate,
  CertificatePage,
  CertificateRequest,
  CertificationRequest,
  CertificationResponse,
  Partnership,
  PartnershipPage,
  PartnershipRequest,
  PtDocumentDto,
  PtProfile,
  PtVerificationStatusResponse,
  ServicePage,
  SubmitPtRegistrationRequest,
  TrainerService,
  TrainerServiceRequest,
  UpdatePtProfileRequest,
} from "@/types/Trainer";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type {
  Availability,
  AvailabilityPage,
  AvailabilityRequest,
  Certificate,
  CertificatePage,
  CertificateRequest,
  CertificationRequest,
  CertificationResponse,
  Partnership,
  PartnershipActionRequest,
  PartnershipPage,
  PartnershipRequest,
  PtDocumentDto,
  PtProfile,
  PtVerificationStatusResponse,
  ServicePage,
  SubmitPtRegistrationRequest,
  TrainerService,
  TrainerServiceRequest,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

const defaultPage: PaginationParams = { page: 0, size: 20 };

function certificateForm(payload: CertificateRequest, files: File[] = []) {
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  files.forEach((file) => form.append("files", file));
  return form;
}

export const trainerService = {
  getPublicProfile: (userId: number) =>
    api.get<PtProfile>(`/pt/profile/${userId}`),

  getMyProfile: () => api.get<PtProfile>("/pt/profile/me"),

  updateMyProfile: (payload: UpdatePtProfileRequest) =>
    api.put<PtProfile, UpdatePtProfileRequest>("/pt/profile/me", payload),

  uploadAvatar(file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.post<PtProfile, FormData>("/pt/profile/me/avatar", form);
  },

  getPublicServices: (
    profileId: number,
    params: PaginationParams = defaultPage,
  ) =>
    api.get<ServicePage>(`/pt/services/profile/${profileId}`, {
      params: { ...params, activeOnly: true },
    }),

  getMyServices: (params: PaginationParams = defaultPage) =>
    api.get<ServicePage>("/pt/services/me", { params }),

  createService: (payload: TrainerServiceRequest) =>
    api.post<TrainerService, TrainerServiceRequest>("/pt/services/me", payload),

  updateService: (id: number, payload: TrainerServiceRequest) =>
    api.put<TrainerService, TrainerServiceRequest>(
      `/pt/services/me/${id}`,
      payload,
    ),

  toggleService: (id: number, isActive: boolean) =>
    api.put<TrainerService>(`/pt/services/me/${id}/toggle`, undefined, {
      params: { isActive },
    }),

  async deleteService(id: number) {
    await api.deleteRaw(`/pt/services/me/${id}`);
  },

  getPublicAvailability: (
    profileId: number,
    params: PaginationParams = defaultPage,
  ) =>
    api.get<AvailabilityPage>(`/pt/availability/profile/${profileId}`, {
      params,
    }),

  getMyAvailability: (params: PaginationParams = defaultPage) =>
    api.get<AvailabilityPage>("/pt/availability/me", { params }),

  createAvailability: (payload: AvailabilityRequest) =>
    api.post<Availability, AvailabilityRequest>("/pt/availability/me", payload),

  updateAvailability: (id: number, payload: AvailabilityRequest) =>
    api.put<Availability, AvailabilityRequest>(
      `/pt/availability/me/${id}`,
      payload,
    ),

  async deleteAvailability(id: number) {
    await api.deleteRaw(`/pt/availability/me/${id}`);
  },

  getPublicCertificates: (
    profileId: number,
    params: PaginationParams = defaultPage,
  ) =>
    api.get<CertificatePage>(`/pt/certificates/profile/${profileId}`, {
      params,
    }),

  getMyCertificates: (params: PaginationParams = defaultPage) =>
    api.get<CertificatePage>("/pt/certificates/me", { params }),

  createCertificate: (payload: CertificateRequest, files?: File[]) =>
    api.post<Certificate, FormData>(
      "/pt/certificates/me",
      certificateForm(payload, files),
    ),

  updateCertificate: (
    id: number,
    payload: CertificateRequest,
    files?: File[],
  ) =>
    api.put<Certificate, FormData>(
      `/pt/certificates/me/${id}`,
      certificateForm(payload, files),
    ),

  async deleteCertificate(id: number) {
    await api.deleteRaw(`/pt/certificates/me/${id}`);
  },

  // ── PT self-service (UC-007) — PT is created/managed by its Gym ──
  getMyProfilePreview: () =>
    api.get<PtVerificationStatusResponse>("/pt/profile/preview"),

  updateMyLimitedProfile: (payload: UpdatePtProfileRequest) =>
    api.putRaw("/pt/profile", payload),

  listCertifications: () =>
    api.get<CertificationResponse[]>("/pt/certifications"),

  getMyPartnerships: (
    params: PaginationParams & { status?: string } = defaultPage,
  ) => api.get<PartnershipPage>("/pt/partnerships/me", { params }),

  requestPartnership: (payload: PartnershipRequest) =>
    api.post<Partnership, PartnershipRequest>(
      "/pt/partnerships/request",
      payload,
    ),

  endPartnership: (id: number) =>
    api.put<Partnership>(`/pt/partnerships/${id}/end`),
};
