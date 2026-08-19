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
  /** Ảnh hồ sơ PT (media TRAINER/AVATAR), khác ảnh tài khoản ở /profile. */
  avatarUrl?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  certifications?: CertificationResponse[];
  averageRating?: number;
  reviewCount?: number;
}

// BE V85: lịch PT do GYM xếp. AvailabilitySlot (lịch tuần) và BlockedTime của
// các mô hình trước đã bị gỡ khỏi BE từ lâu — kiểu dữ liệu tương ứng nằm ở
// types/Shift.ts (ca, phân ca, đơn nghỉ).

/**
 * UC-022: phân công PT vào CHI NHÁNH. Câu 24 (BE V78) bỏ hẳn phân công theo
 * dịch vụ/gói tập — chi nhánh là đích duy nhất, và cột gym_branch_id đã NOT NULL.
 */
export interface PtAssignment {
  id?: number;
  ptId?: number;
  branchId?: number;
  branchName?: string;
  active?: boolean;
}

export interface PtAssignmentInput {
  branchId: number;
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
