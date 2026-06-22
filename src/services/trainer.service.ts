import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
import type { PaginationParams } from "@/shared/types/pagination.type";

type Schemas = components["schemas"];
export type PtProfile = Schemas["PtProfileResponse"];
export type UpdatePtProfileRequest = Schemas["UpdatePtProfileRequest"];
export type TrainerService = Schemas["ServiceResponse"];
export type TrainerServiceRequest = Schemas["ServiceRequest"];
type GeneratedAvailability = Schemas["AvailabilityResponse"];
type GeneratedAvailabilityRequest = Schemas["AvailabilityRequest"];
// Spring/Jackson runtime serializes LocalTime as HH:mm:ss although the current
// OpenAPI document exposes it as an object. Verified against the local API.
export type Availability = Omit<GeneratedAvailability, "startTime" | "endTime"> & {
  startTime?: string;
  endTime?: string;
};
export type AvailabilityRequest = Omit<GeneratedAvailabilityRequest, "startTime" | "endTime"> & {
  startTime: string;
  endTime: string;
};
export type Certificate = Schemas["CertificateResponse"];
export type CertificateRequest = Schemas["CertificateRequest"];
export type Partnership = Schemas["PartnershipResponse"];
export type PartnershipRequest = Schemas["PartnershipRequest"];
export type PartnershipActionRequest = Schemas["PartnershipActionRequest"];
export type ServicePage = Schemas["PagedResponseServiceResponse"];
export type AvailabilityPage = Omit<Schemas["PagedResponseAvailabilityResponse"], "content"> & {
  content?: Availability[];
};
export type CertificatePage = Schemas["PagedResponseCertificateResponse"];
export type PartnershipPage = Schemas["PagedResponsePartnershipResponse"];

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
  async getPublicProfile(userId: number) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePtProfileResponse"]
    >(`/pt/profile/${userId}`);
    return unwrapApiData(response.data);
  },
  async getMyProfile() {
    const response =
      await axiosClient.get<Schemas["ApiResponsePtProfileResponse"]>(
        "/pt/profile/me",
      );
    return unwrapApiData(response.data);
  },
  async updateMyProfile(payload: UpdatePtProfileRequest) {
    const response = await axiosClient.put<
      Schemas["ApiResponsePtProfileResponse"]
    >("/pt/profile/me", payload);
    return unwrapApiData(response.data);
  },
  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await axiosClient.post<
      Schemas["ApiResponsePtProfileResponse"]
    >("/pt/profile/me/avatar", form);
    return unwrapApiData(response.data);
  },
  async getPublicServices(
    profileId: number,
    params: PaginationParams = defaultPage,
  ) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponseServiceResponse"]
    >(`/pt/services/profile/${profileId}`, {
      params: { ...params, activeOnly: true },
    });
    return unwrapApiData(response.data);
  },
  async getMyServices(params: PaginationParams = defaultPage) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponseServiceResponse"]
    >("/pt/services/me", { params });
    return unwrapApiData(response.data);
  },
  async createService(payload: TrainerServiceRequest) {
    const response = await axiosClient.post<
      Schemas["ApiResponseServiceResponse"]
    >("/pt/services/me", payload);
    return unwrapApiData(response.data);
  },
  async updateService(id: number, payload: TrainerServiceRequest) {
    const response = await axiosClient.put<
      Schemas["ApiResponseServiceResponse"]
    >(`/pt/services/me/${id}`, payload);
    return unwrapApiData(response.data);
  },
  async toggleService(id: number, isActive: boolean) {
    const response = await axiosClient.put<
      Schemas["ApiResponseServiceResponse"]
    >(`/pt/services/me/${id}/toggle`, undefined, { params: { isActive } });
    return unwrapApiData(response.data);
  },
  async deleteService(id: number) {
    await axiosClient.delete(`/pt/services/me/${id}`);
  },
  async getPublicAvailability(
    profileId: number,
    params: PaginationParams = defaultPage,
  ) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponseAvailabilityResponse"]
    >(`/pt/availability/profile/${profileId}`, { params });
    return unwrapApiData(response.data) as AvailabilityPage;
  },
  async getMyAvailability(params: PaginationParams = defaultPage) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponseAvailabilityResponse"]
    >("/pt/availability/me", { params });
    return unwrapApiData(response.data) as AvailabilityPage;
  },
  async createAvailability(payload: AvailabilityRequest) {
    const response = await axiosClient.post<
      Schemas["ApiResponseAvailabilityResponse"]
    >("/pt/availability/me", payload);
    return unwrapApiData(response.data) as Availability;
  },
  async updateAvailability(id: number, payload: AvailabilityRequest) {
    const response = await axiosClient.put<
      Schemas["ApiResponseAvailabilityResponse"]
    >(`/pt/availability/me/${id}`, payload);
    return unwrapApiData(response.data) as Availability;
  },
  async deleteAvailability(id: number) {
    await axiosClient.delete(`/pt/availability/me/${id}`);
  },
  async getPublicCertificates(
    profileId: number,
    params: PaginationParams = defaultPage,
  ) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponseCertificateResponse"]
    >(`/pt/certificates/profile/${profileId}`, { params });
    return unwrapApiData(response.data);
  },
  async getMyCertificates(params: PaginationParams = defaultPage) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponseCertificateResponse"]
    >("/pt/certificates/me", { params });
    return unwrapApiData(response.data);
  },
  async createCertificate(payload: CertificateRequest, files?: File[]) {
    const response = await axiosClient.post<
      Schemas["ApiResponseCertificateResponse"]
    >("/pt/certificates/me", certificateForm(payload, files));
    return unwrapApiData(response.data);
  },
  async updateCertificate(
    id: number,
    payload: CertificateRequest,
    files?: File[],
  ) {
    const response = await axiosClient.put<
      Schemas["ApiResponseCertificateResponse"]
    >(`/pt/certificates/me/${id}`, certificateForm(payload, files));
    return unwrapApiData(response.data);
  },
  async deleteCertificate(id: number) {
    await axiosClient.delete(`/pt/certificates/me/${id}`);
  },
  async getMyPartnerships(
    params: PaginationParams & { status?: string } = defaultPage,
  ) {
    const response = await axiosClient.get<
      Schemas["ApiResponsePagedResponsePartnershipResponse"]
    >("/pt/partnerships/me", { params });
    return unwrapApiData(response.data);
  },
  async requestPartnership(payload: PartnershipRequest) {
    const response = await axiosClient.post<
      Schemas["ApiResponsePartnershipResponse"]
    >("/pt/partnerships/request", payload);
    return unwrapApiData(response.data);
  },
  async endPartnership(id: number) {
    const response = await axiosClient.put<
      Schemas["ApiResponsePartnershipResponse"]
    >(`/pt/partnerships/${id}/end`);
    return unwrapApiData(response.data);
  },
};
