import type { PageResponse } from "@/shared/types/api-response.type";
import type { Media } from "@/types/Media";

export type ReviewStatus = "VISIBLE" | "HIDDEN" | "REMOVED";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

/** ReviewResponse của BE (UC-069). Review một chiều — không có phản hồi của gym. */
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
  /** Ảnh khách đính kèm (BE V64) — lưu trên GCS, BE trả về URL đã giải sẵn. */
  images?: Media[];
  createdAt?: string;
}

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
  /**
   * Id ảnh đã upload qua /media/upload (entityType=REVIEW, imageType=REVIEW_IMAGE).
   * Khi sửa đánh giá đây là trạng thái CUỐI CÙNG: ảnh bị bỏ khỏi mảng sẽ được BE
   * xoá khỏi storage.
   */
  mediaIds?: number[];
}

/** RatingSummaryResponse của BE (UC-009) — điểm trung bình + phổ điểm 1..5 sao. */
export interface RatingSummary {
  targetType: string;
  targetId: number;
  averageRating: number;
  totalReviews: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
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
