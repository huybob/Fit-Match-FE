import { api } from "@/services/api";
import type {
  ModerateReviewRequest,
  RatingSummary,
  ReportStatus,
  Review,
  ReviewPage,
  ReviewReportPage,
  ReviewRequest,
} from "@/types/Review";

export type {
  ModerateReviewRequest,
  RatingSummary,
  ReportStatus,
  Review,
  ReviewPage,
  ReviewReport,
  ReviewReportPage,
  ReviewRequest,
  ReviewStatus,
} from "@/types/Review";

function list(path: string, params?: Record<string, unknown>) {
  return api.get<ReviewPage>(path, { params: { page: 0, size: 20, ...params } });
}

export const reviewService = {
  // ---- Customer (UC-069/070) ----
  // Chỉ booking COMPLETED của chính khách mới đánh giá được — BE lấy gym/PT từ booking.
  getMine: () => list("/reviews/me"),
  create: (payload: ReviewRequest) => api.post<Review, ReviewRequest>("/reviews", payload),
  update: (id: number, payload: ReviewRequest) =>
    api.put<Review, ReviewRequest>(`/reviews/${id}`, payload),
  async remove(id: number) {
    await api.deleteRaw(`/reviews/${id}`);
  },
  report: (id: number, reason: string) =>
    api.post<void, { reason: string }>(`/reviews/${id}/report`, { reason }),

  // ---- Public (UC-009): chỉ review VISIBLE, dùng cho trang gym/PT công khai ----
  getPt: (id: number, params?: { page?: number; size?: number }) =>
    list(`/reviews/pt/${id}`, params),
  getGym: (id: number, params?: { page?: number; size?: number }) =>
    list(`/reviews/gym/${id}`, params),

  // Điểm TB + phổ điểm 1..5 sao (UC-009). Tách khỏi danh sách review để trang
  // chi tiết vẽ được biểu đồ mà không phải tải hết review về đếm ở client.
  getGymRating: (id: number) => api.get<RatingSummary>(`/reviews/gym/${id}/rating`),
  getPtRating: (id: number) => api.get<RatingSummary>(`/reviews/pt/${id}/rating`),

  // ---- Gym (UC-023): chỉ đọc để theo dõi chất lượng ----
  getGymOwn: (params?: { page?: number; size?: number }) => list("/gym/reviews", params),

  // ---- Moderator/Admin (UC-071) ----
  getReports: (status?: ReportStatus, params?: { page?: number; size?: number }) =>
    api.get<ReviewReportPage>("/admin/reviews/reports", {
      params: { page: 0, size: 20, status, ...params },
    }),
  moderate: (id: number, payload: ModerateReviewRequest) =>
    api.post<Review, ModerateReviewRequest>(`/admin/reviews/${id}/moderate`, payload),
  resolveReport: (id: number, note?: string) =>
    api.post<unknown, { note?: string }>(`/admin/reviews/reports/${id}/resolve`, { note }),
  dismissReport: (id: number, note?: string) =>
    api.post<unknown, { note?: string }>(`/admin/reviews/reports/${id}/dismiss`, { note }),
};
