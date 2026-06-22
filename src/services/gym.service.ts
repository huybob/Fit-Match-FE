import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
import type { PaginationParams } from "@/shared/types/pagination.type";

type S = components["schemas"];
export type Gym = S["GymResponse"];
export type GymRequest = S["GymRequest"];
export type GymPage = S["PagedResponseGymResponse"];
export type GymBranch = S["BranchResponse"];
export type BranchRequest = S["BranchRequest"];
export type BranchPage = S["PagedResponseBranchResponse"];
export type GymFacility = S["FacilityResponse"];
export type FacilityRequest = S["FacilityRequest"];
export type FacilityPage = S["PagedResponseFacilityResponse"];
export type GymPartnership = S["PartnershipResponse"];
export type PartnershipPage = S["PagedResponsePartnershipResponse"];
export type PartnershipActionRequest = S["PartnershipActionRequest"];

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
    const response = await axiosClient.get<
      S["ApiResponsePagedResponseGymResponse"]
    >("/gyms", { params: { ...page, ...params } });
    return unwrapApiData(response.data);
  },
  async getDetail(id: number) {
    const response = await axiosClient.get<S["ApiResponseGymResponse"]>(
      `/gyms/${id}`,
    );
    return unwrapApiData(response.data);
  },
  async getMine(params: PaginationParams = page) {
    const response = await axiosClient.get<
      S["ApiResponsePagedResponseGymResponse"]
    >("/gyms/me", { params });
    return unwrapApiData(response.data);
  },
  async create(payload: GymRequest) {
    const response = await axiosClient.post<S["ApiResponseGymResponse"]>(
      "/gyms",
      payload,
    );
    return unwrapApiData(response.data);
  },
  async update(id: number, payload: GymRequest) {
    const response = await axiosClient.put<S["ApiResponseGymResponse"]>(
      `/gyms/${id}`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async close(id: number) {
    await axiosClient.put(`/gyms/${id}/close`);
  },
  async reopen(id: number) {
    await axiosClient.put(`/gyms/${id}/reopen`);
  },
  async uploadLogo(id: number, file: File) {
    const response = await axiosClient.post<S["ApiResponseGymResponse"]>(
      `/gyms/${id}/logo`,
      upload(file),
    );
    return unwrapApiData(response.data);
  },
  async uploadCover(id: number, file: File) {
    const response = await axiosClient.post<S["ApiResponseGymResponse"]>(
      `/gyms/${id}/cover`,
      upload(file),
    );
    return unwrapApiData(response.data);
  },
  async getBranches(gymId: number, params: PaginationParams = page) {
    const response = await axiosClient.get<
      S["ApiResponsePagedResponseBranchResponse"]
    >(`/gyms/${gymId}/branches`, { params });
    return unwrapApiData(response.data);
  },
  async createBranch(gymId: number, payload: BranchRequest) {
    const response = await axiosClient.post<S["ApiResponseBranchResponse"]>(
      `/gyms/${gymId}/branches`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async updateBranch(gymId: number, id: number, payload: BranchRequest) {
    const response = await axiosClient.put<S["ApiResponseBranchResponse"]>(
      `/gyms/${gymId}/branches/${id}`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async deleteBranch(gymId: number, id: number) {
    await axiosClient.delete(`/gyms/${gymId}/branches/${id}`);
  },
  async getFacilities(gymId: number, params: PaginationParams = page) {
    const response = await axiosClient.get<
      S["ApiResponsePagedResponseFacilityResponse"]
    >(`/gyms/${gymId}/facilities`, { params });
    return unwrapApiData(response.data);
  },
  async createFacility(gymId: number, payload: FacilityRequest) {
    const response = await axiosClient.post<S["ApiResponseFacilityResponse"]>(
      `/gyms/${gymId}/facilities`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async updateFacility(gymId: number, id: number, payload: FacilityRequest) {
    const response = await axiosClient.put<S["ApiResponseFacilityResponse"]>(
      `/gyms/${gymId}/facilities/${id}`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async deleteFacility(gymId: number, id: number) {
    await axiosClient.delete(`/gyms/${gymId}/facilities/${id}`);
  },
  async getPartnerships(status?: string) {
    const response = await axiosClient.get<
      S["ApiResponsePagedResponsePartnershipResponse"]
    >("/pt/partnerships/me", { params: { ...page, status } });
    return unwrapApiData(response.data);
  },
  async approvePartnership(id: number, payload: PartnershipActionRequest) {
    const response = await axiosClient.put<S["ApiResponsePartnershipResponse"]>(
      `/pt/partnerships/${id}/approve`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async rejectPartnership(id: number, payload: PartnershipActionRequest) {
    const response = await axiosClient.put<S["ApiResponsePartnershipResponse"]>(
      `/pt/partnerships/${id}/reject`,
      payload,
    );
    return unwrapApiData(response.data);
  },
  async endPartnership(id: number) {
    const response = await axiosClient.put<S["ApiResponsePartnershipResponse"]>(
      `/pt/partnerships/${id}/end`,
    );
    return unwrapApiData(response.data);
  },
};
