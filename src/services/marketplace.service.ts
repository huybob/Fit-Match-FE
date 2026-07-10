import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

export interface GymPublicProfile {
  id?: number;
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
}

export interface PublicCertification {
  id?: number;
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface PtPublicProfile {
  id?: number;
  displayName?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  certifications?: PublicCertification[];
}

export interface GymSearchParams {
  keyword?: string;
  city?: string;
  page?: number;
  size?: number;
}

export interface PtSearchParams {
  keyword?: string;
  specialization?: string;
  serviceArea?: string;
  page?: number;
  size?: number;
}

export const marketplaceService = {
  searchGyms: (params: GymSearchParams = {}) =>
    api.get<PageResponse<GymPublicProfile>>("/marketplace/gyms", {
      params: { page: 0, size: 20, ...params },
    }),
  getGym: (id: number) =>
    api.get<GymPublicProfile>(`/marketplace/gyms/${id}`),
  searchPts: (params: PtSearchParams = {}) =>
    api.get<PageResponse<PtPublicProfile>>("/marketplace/pts", {
      params: { page: 0, size: 20, ...params },
    }),
  getPt: (id: number) =>
    api.get<PtPublicProfile>(`/marketplace/pts/${id}`),
};
