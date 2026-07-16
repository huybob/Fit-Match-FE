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

// ── Weekly availability & blocked times (UC-028/029) ──

export interface AvailabilitySlotDto {
  /** 1 (Thứ 2) .. 7 (Chủ nhật). */
  dayOfWeek: number;
  /** "HH:mm". */
  startTime: string;
  endTime: string;
}

/** Gym truyền đúng MỘT trong ptId/branchId; PT tự tạo thì bỏ trống cả hai. */
export interface BlockedTimeRequest {
  ptId?: number | null;
  branchId?: number | null;
  /** ISO datetime. */
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface BlockedTimeResponse {
  id?: number;
  ptId?: number | null;
  branchId?: number | null;
  startAt?: string;
  endAt?: string;
  reason?: string;
}
