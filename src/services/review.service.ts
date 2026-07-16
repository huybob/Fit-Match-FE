import { api } from "@/services/api";
import type {
  ModerateReviewRequest,
  ReplyRequest,
  ReportStatus,
  Review,
  ReviewPage,
  ReviewReportPage,
  ReviewRequest,
} from "@/types/Review";

export type {
  ModerateReviewRequest,
  ReplyRequest,
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
  getMine: () => list("/reviews/me"),
  create: (payload: ReviewRequest) => api.post<Review, ReviewRequest>("/reviews", payload),
  update: (id: number, payload: ReviewRequest) =>
    api.put<Review, ReviewRequest>(`/reviews/${id}`, payload),
  async remove(id: number) {
    await api.deleteRaw(`/reviews/${id}`);
  },
  report: (id: number, reason: string) =>
    api.post<void, { reason: string }>(`/reviews/${id}/report`, { reason }),

  // ---- Public (UC-009) ----
  getPt: (id: number) => list(`/reviews/pt/${id}`),
  getGym: (id: number) => list(`/reviews/gym/${id}`),

  // ---- Gym (UC-069/023) ----
  getGymOwn: (params?: { page?: number; size?: number }) => list("/gym/reviews", params),
  reply: (id: number, payload: ReplyRequest) =>
    api.put<Review, ReplyRequest>(`/reviews/${id}/reply`, payload),

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
