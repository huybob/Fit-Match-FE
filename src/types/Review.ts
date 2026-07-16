import type { PageResponse } from "@/shared/types/api-response.type";

export type ReviewStatus = "VISIBLE" | "HIDDEN" | "REMOVED";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

/** ReviewResponse của BE (UC-069). */
export interface Review {
  id: number;
  bookingId?: number;
  customerName?: string;
  gymId?: number;
  gymName?: string;
  serviceId?: number;
  serviceName?: string;
  ptProfileId?: number;
  ptName?: string;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  reply?: string;
  repliedByName?: string;
  repliedAt?: string;
  createdAt?: string;
}

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface ReplyRequest {
  reply: string;
}

export interface ReportRequest {
  reason: string;
}

export interface ModerateReviewRequest {
  status: ReviewStatus;
  note?: string;
}

/** ReviewReportResponse của BE (UC-070/071). */
export interface ReviewReport {
  id: number;
  status: ReportStatus;
  reason: string;
  reportedBy?: string;
  moderatorNote?: string;
  createdAt?: string;
  review: Review;
}

export type ReviewPage = PageResponse<Review>;
export type ReviewReportPage = PageResponse<ReviewReport>;
