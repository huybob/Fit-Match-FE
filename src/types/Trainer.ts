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
