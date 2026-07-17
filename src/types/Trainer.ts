import type { PageResponse } from "@/shared/types/api-response.type";

export interface PtProfile {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  experienceYears?: number;
  pricePerHour?: number;
  pricePerSession?: number;
  averageRating?: number;
  [key: string]: unknown;
}

export interface UpdatePtProfileRequest {
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  pricePerHour?: number;
  pricePerSession?: number;
  [key: string]: unknown;
}

export interface TrainerService {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  active?: boolean;
  [key: string]: unknown;
}

export interface TrainerServiceRequest {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export interface Availability {
  id?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  effectiveDate?: string;
  [key: string]: unknown;
}

export interface AvailabilityRequest {
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  effectiveDate?: string;
  [key: string]: unknown;
}

export interface Certificate {
  id?: number;
  name?: string;
  issuer?: string;
  issuingOrg?: string;
  issuedDate?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrls?: string[];
  [key: string]: unknown;
}

export interface CertificateRequest {
  name?: string;
  issuer?: string;
  issuingOrg?: string;
  issuedDate?: string;
  issueDate?: string;
  [key: string]: unknown;
}

export interface Partnership {
  id?: number;
  gymId?: number;
  gymName?: string;
  ptProfileId?: number;
  ptName?: string;
  requestMessage?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PartnershipRequest {
  gymId: number;
  requestMessage?: string;
}

export interface PartnershipActionRequest {
  message?: string;
}

export type ServicePage = PageResponse<TrainerService>;
export type AvailabilityPage = PageResponse<Availability>;
export type CertificatePage = PageResponse<Certificate>;
export type PartnershipPage = PageResponse<Partnership>;

export type PtVerificationStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface PtDocumentDto {
  documentType: string;
  fileUrl: string;
}

export interface SubmitPtRegistrationRequest {
  displayName: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  documents: PtDocumentDto[];
}

export interface PtVerificationStatusResponse {
  verificationStatus?: PtVerificationStatus;
  displayName?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  documents?: PtDocumentDto[];
  rejectionReason?: string;
}

// ── Gói 2.D (audit 2026-07-17) — contract thật của BE ──

/** Preview hồ sơ public của chính PT (GET /pt/profile/preview) — có id để dùng cho reviews (A-3). */
export interface PtPublicPreview {
  id?: number;
  displayName?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  certifications?: CertificationResponse[];
  averageRating?: number;
  reviewCount?: number;
}

/**
 * UC-028 (B-28): slot rảnh hằng tuần — dayOfWeek 1-7 (1 = Thứ 2) khớp BE,
 * KHÔNG phải 0-6 như schema cũ; PUT /pt/availability thay toàn bộ (replace-all).
 */
export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** UC-029: khoảng thời gian chặn (PT hoặc chi nhánh). */
export interface BlockedTime {
  id?: number;
  ptId?: number;
  branchId?: number;
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface BlockedTimeInput {
  ptId?: number;
  branchId?: number;
  startAt: string;
  endAt: string;
  reason?: string;
}

/** UC-022: phân công PT vào đúng-một-trong branch/service/package. */
export interface PtAssignment {
  id?: number;
  ptId?: number;
  branchId?: number;
  branchName?: string;
  serviceId?: number;
  serviceName?: string;
  packageId?: number;
  packageName?: string;
  active?: boolean;
}

export interface PtAssignmentInput {
  branchId?: number;
  serviceId?: number;
  packageId?: number;
}

/** UC-023: hiệu suất PT cho gym/admin. */
export interface PtPerformance {
  ptId?: number;
  displayName?: string;
  averageRating?: number;
  reviewCount?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  noShowBookings?: number;
  disputes?: number;
}

export interface CertificationRequest {
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface CertificationResponse {
  id?: number;
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}
