import type { PageResponse } from "@/shared/types/api-response.type";

export interface Gym {
  id?: number;
  name?: string;
  description?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverUrl?: string;
  averageRating?: number;
  status?: string;
  [key: string]: unknown;
}

export interface GymRequest {
  name: string;
  description?: string;
  city: string;
  district: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface GymBranch {
  id?: number;
  gymId?: number;
  name?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface BranchRequest {
  name: string;
  address: string;
  city?: string;
  district?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface GymFacility {
  id?: number;
  gymId?: number;
  name?: string;
  type: FacilityType;
  description?: string;
  iconUrl?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export interface FacilityRequest {
  name: string;
  type?: FacilityType;
  description?: string;
  iconUrl?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export type FacilityType =
  | "EQUIPMENT"
  | "AMENITY"
  | "CLASS_ROOM"
  | "LOCKER_ROOM"
  | "SHOWER"
  | "PARKING"
  | "WIFI"
  | "OTHER";

export interface GymPartnership {
  id?: number;
  gymId?: number;
  gymName?: string;
  profileId?: number;
  ptProfileId?: number;
  ptName?: string;
  requestMessage?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PartnershipActionRequest {
  message?: string;
}

export type GymPage = PageResponse<Gym>;
export type BranchPage = PageResponse<GymBranch>;
export type FacilityPage = PageResponse<GymFacility>;
export type PartnershipPage = PageResponse<GymPartnership>;

export type GymVerificationStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface GymDocumentDto {
  documentType: string;
  fileUrl: string;
}

export interface SubmitGymRegistrationRequest {
  gymName: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  documents: GymDocumentDto[];
}

export interface GymVerificationStatusResponse {
  verificationStatus?: GymVerificationStatus;
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  documents?: GymDocumentDto[];
  rejectionReason?: string;
}

// ── Gym operator workspace — flat endpoints scoped to the authenticated operator ──

export interface BranchResponse {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  active?: boolean;
}

export interface BranchInput {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
}

export interface FacilityResponse {
  id?: number;
  name?: string;
  description?: string;
  active?: boolean;
}

export interface FacilityInput {
  name: string;
  description?: string;
}

export interface GymServiceResponse {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  categoryId?: number;
  categoryName?: string;
  eligibilityNotes?: string;
  bookingRules?: BookingRulesDto;
  status?: CatalogStatus;
  active?: boolean;
}

export interface GymServiceInput {
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
}

export interface UpdateGymProfileInput {
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
}

// ── Gym-managed PTs (UC-019..021) ──

export type GymPtStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface GymPtResponse {
  id?: number;
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  specialization?: string;
  serviceArea?: string;
  experienceYears?: number;
  status?: GymPtStatus;
  suspensionReason?: string;
  gymProfileId?: number;
}

export type GymPtPage = PageResponse<GymPtResponse>;

export interface CreateGymPtInput {
  username: string;
  email: string;
  password: string;
  phone?: string;
  displayName: string;
  bio?: string;
  specialization?: string;
  serviceArea?: string;
  experienceYears?: number;
}

export interface UpdateGymPtInput {
  displayName?: string;
  bio?: string;
  specialization?: string;
  serviceArea?: string;
  experienceYears?: number;
}

export interface PtStatusInput {
  status: GymPtStatus;
}

export interface PtCertInput {
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface PtCertResponse {
  id?: number;
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface PtDocInput {
  documentType: string;
  fileUrl: string;
}

export interface PtDocResponse {
  id?: number;
  documentType?: string;
  fileUrl?: string;
}

// ── Catalog lifecycle & booking rules (UC-026/027) ──

/** PUBLISHED / HIDDEN / PAUSED / ARCHIVED; ARCHIVED là trạng thái cuối. */
export type CatalogStatus = "PUBLISHED" | "HIDDEN" | "PAUSED" | "ARCHIVED";

export interface BookingRulesDto {
  /** 0-100; null = trả đủ khi checkout. */
  depositPercent?: number | null;
  freeCancellationHours?: number | null;
  minNoticeHours?: number | null;
}

// ── Branch operating hours (UC-017) ──

export interface OperatingHourDto {
  /** 1 (Thứ 2) .. 7 (Chủ nhật), không trùng ngày. */
  dayOfWeek: number;
  /** "HH:mm"; bỏ trống khi closed = true. */
  openTime?: string | null;
  closeTime?: string | null;
  closed?: boolean;
}

// ── Gym media (UC-016) ──

export interface GymMediaRequest {
  /** URL lấy từ POST /files/upload. */
  url: string;
  caption?: string;
  /** null = ảnh chung của Gym. */
  branchId?: number | null;
}

export interface GymMediaResponse {
  id?: number;
  url?: string;
  caption?: string;
  branchId?: number | null;
}

// ── Gym policies (UC-017) ──

export interface GymPolicyRequest {
  bookingPolicy?: string;
  cancellationPolicy?: string;
  noShowPolicy?: string;
  houseRules?: string;
}

export interface GymPolicyResponse extends GymPolicyRequest {
  id?: number;
}

// ── PT assignments (UC-022) ──

/** Truyền đúng MỘT trong branchId/serviceId/packageId. */
export interface PtAssignmentRequest {
  branchId?: number;
  serviceId?: number;
  packageId?: number;
}

export interface PtAssignmentResponse {
  id?: number;
  ptId?: number;
  branchId?: number | null;
  branchName?: string | null;
  serviceId?: number | null;
  serviceName?: string | null;
  packageId?: number | null;
  packageName?: string | null;
  active?: boolean;
}

// ── Training packages (UC-025..027) ──

export interface TrainingPackageRequest {
  name: string;
  description?: string;
  price: number;
  sessionCount: number;
  validityDays: number;
  usageConditions?: string;
  gymServiceId?: number | null;
}

export interface TrainingPackageResponse {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  sessionCount?: number;
  validityDays?: number;
  usageConditions?: string;
  gymServiceId?: number | null;
  gymServiceName?: string | null;
  bookingRules?: BookingRulesDto;
  status?: CatalogStatus;
  active?: boolean;
}
