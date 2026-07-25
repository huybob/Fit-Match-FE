import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

export interface GymPublicProfile {
  id?: number;
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  /** UC-071: điểm đánh giá trung bình + số lượt (review VISIBLE). */
  averageRating?: number;
  reviewCount?: number;
  /** Ảnh đại diện card danh sách (media đầu tiên của gym). */
  coverUrl?: string;
  /** Bug 14: badge "Đã xác minh" data-driven (hồ sơ APPROVED). */
  verified?: boolean;
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
  /** UC-071: điểm đánh giá trung bình + số lượt (review VISIBLE). */
  averageRating?: number;
  reviewCount?: number;
  /** Phòng gym quản lý PT — điều hướng sang trang gym. */
  gymId?: number;
  gymName?: string;
  /** Bug 14: badge "Xác thực" data-driven (PT ACTIVE thuộc gym đã duyệt). */
  verified?: boolean;
}

export interface GymSearchParams {
  keyword?: string;
  city?: string;
  district?: string;
  /** Bug 11: lọc theo khoảng giá gói tập PUBLISHED của gym (VND). */
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  /** UC-008: Spring Pageable sort, ví dụ "createdAt,desc" | "gymName,asc". */
  sort?: string;
}

export interface PtSearchParams {
  keyword?: string;
  specialization?: string;
  serviceArea?: string;
  page?: number;
  size?: number;
  /** UC-008: Spring Pageable sort, ví dụ "createdAt,desc" | "displayName,asc". */
  sort?: string;
}

/** Booking rules công khai của dịch vụ/gói (UC-026). */
export interface PublicBookingRules {
  depositPercent?: number;
  freeCancellationHours?: number;
  minNoticeHours?: number;
}

export interface PublicOperatingHour {
  dayOfWeek?: number;
  openTime?: string;
  closeTime?: string;
  closed?: boolean;
}

export interface PublicBranch {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  amenities?: string;
  capacity?: number;
  operatingHours?: PublicOperatingHour[];
}

export interface PublicGymService {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  categoryName?: string;
  eligibilityNotes?: string;
  bookingRules?: PublicBookingRules;
}

export interface PublicTrainingPackage {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  sessionCount?: number;
  validityDays?: number;
  usageConditions?: string;
  gymServiceId?: number;
  gymServiceName?: string;
  bookingRules?: PublicBookingRules;
}

export interface PublicGymMedia {
  id?: number;
  url?: string;
  caption?: string;
  /** Media gắn với chi nhánh cụ thể; null = ảnh chung của gym. */
  branchId?: number;
  [key: string]: unknown;
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

  // UC-009: catalog công khai của một gym — phục vụ trang chi tiết & tạo booking.
  getGymBranches: (id: number) =>
    api.get<PublicBranch[]>(`/marketplace/gyms/${id}/branches`),
  getGymServices: (id: number) =>
    api.get<PublicGymService[]>(`/marketplace/gyms/${id}/services`),
  getGymPackages: (id: number) =>
    api.get<PublicTrainingPackage[]>(`/marketplace/gyms/${id}/packages`),
  getGymMedia: (id: number) =>
    api.get<PublicGymMedia[]>(`/marketplace/gyms/${id}/media`),
  getGymPts: (id: number, params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<PtPublicProfile>>(`/marketplace/gyms/${id}/pts`, {
      params: { page: 0, size: 50, ...params },
    }),
};
