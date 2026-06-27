import { api } from "@/services/api";
import type {
  ReplyRequest,
  Review,
  ReviewPage,
  ReviewRequest,
} from "@/types/Review";

export type {
  ReplyRequest,
  Review,
  ReviewPage,
  ReviewRequest,
} from "@/types/Review";

function list(path: string) {
  return api.get<ReviewPage>(path, {
    params: { page: 0, size: 20 },
  });
}

export const reviewService = {
  getMine: () => list("/reviews/me"),
  getPt: (id: number) => list(`/reviews/pt/${id}`),
  getGym: (id: number) => list(`/reviews/gym/${id}`),
  create: (payload: ReviewRequest) =>
    api.post<Review, ReviewRequest>("/reviews", payload),
  update: (id: number, payload: ReviewRequest) =>
    api.put<Review, ReviewRequest>(`/reviews/${id}`, payload),
  async remove(id: number) {
    await api.deleteRaw(`/reviews/${id}`);
  },
  reply: (id: number, payload: ReplyRequest) =>
    api.put<Review, ReplyRequest>(`/reviews/${id}/reply`, payload),
};
