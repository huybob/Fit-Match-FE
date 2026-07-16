/** PUT /pt/profile — cập nhật một phần, trường null/undefined = giữ nguyên. */
export interface UpdatePtProfileRequest {
  displayName?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
}

export type PtVerificationStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface PtDocumentDto {
  documentType: string;
  fileUrl: string;
}

/** GET /pt/profile/preview — BE trả PtPublicProfileResponse (có id của PtProfile). */
export interface PtVerificationStatusResponse {
  id?: number;
  verificationStatus?: PtVerificationStatus;
  displayName?: string;
  bio?: string;
  serviceArea?: string;
  specialization?: string;
  experienceYears?: number;
  certifications?: CertificationResponse[];
  averageRating?: number;
  reviewCount?: number;
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
