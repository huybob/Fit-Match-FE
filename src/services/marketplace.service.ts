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
  /**
   * UC-18 (V55): toạ độ marker. Ở kết quả tìm theo bán kính đây là điểm GẦN NGƯỜI
   * DÙNG NHẤT (trụ sở hoặc một chi nhánh) chứ không chắc là trụ sở.
   */
  latitude?: number;
  longitude?: number;
  /** Tên chi nhánh gần nhất; bỏ trống nghĩa là điểm gần nhất chính là trụ sở. */
  nearestBranchName?: string;
  /** Khoảng cách (km) tới điểm gần nhất — chỉ có khi tìm theo bán kính. */
  distanceKm?: number;
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
  /**
   * UC-18 (V55): tâm tìm kiếm theo bán kính. Phải gửi lat + lng cùng nhau (BE trả
   * 400 nếu thiếu một trong hai). Khi có toạ độ, BE luôn sắp theo khoảng cách và
   * bỏ qua `sort`.
   */
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  size?: number;
  /** UC-008: Spring Pageable sort, ví dụ "createdAt,desc" | "gymName,asc". */
  sort?: string;
}

export interface PtSearchParams {
  keyword?: string;
  /**
   * Sheet1#17: chọn được NHIỀU chuyên môn. paramsSerializer của axiosClient lặp
   * key cho mảng (`?specialization=A&specialization=B`) — khớp `List<String>`
   * mà MarketplacePtController nhận, và BE nối các giá trị bằng OR.
   */
  specialization?: string[];
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
  /** UC-18 (V55): toạ độ chi nhánh — marker trên bản đồ trang chi tiết gym. */
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

/** UC-18 (V55): kết quả ánh xạ địa chỉ <-> toạ độ từ proxy geocode của BE. */
export interface GeocodeResult {
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
}

/** Bug S2-14: một khung giờ rảnh lặp hàng tuần của PT (dayOfWeek 1-7, 1 = Thứ 2). */
export interface PublicAvailabilitySlot {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

export interface PublicGymService {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  /** Bug S2-05: phụ phí khi chọn PT — giá cuối = price + ptSurcharge. */
  ptSurcharge?: number;
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
  /** Bug S2-05: phụ phí khi chọn PT — giá cuối = price + ptSurcharge. */
  ptSurcharge?: number;
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
  /**
   * Bug S2-04: có `branchId` thì BE chỉ trả PT được phân công cho chi nhánh đó —
   * PT chỉ phụ trách một chi nhánh sẽ không còn hiện ra để rồi bị từ chối ở checkout.
   */
  getGymPts: (id: number, params: { page?: number; size?: number; branchId?: number } = {}) =>
    api.get<PageResponse<PtPublicProfile>>(`/marketplace/gyms/${id}/pts`, {
      params: { page: 0, size: 50, ...params },
    }),

  /** Bug S2-14: thời gian biểu tuần của PT (lịch rảnh khai báo). */
  getPtAvailability: (id: number) =>
    api.get<PublicAvailabilitySlot[]>(`/marketplace/pts/${id}/availability`),

  // UC-18 (V55): proxy geocode phía BE — chỉ dùng khi FE KHÔNG có key Maps
  // JavaScript (khi có key thì geocode ngay ở trình duyệt, không tốn round-trip).
  geocodeAddress: (address: string) =>
    api.get<GeocodeResult>("/marketplace/geocode", { params: { address } }),
  reverseGeocode: (lat: number, lng: number) =>
    api.get<GeocodeResult>("/marketplace/geocode/reverse", { params: { lat, lng } }),
};
