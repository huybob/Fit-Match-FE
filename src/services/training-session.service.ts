import { api } from "@/services/api";
import type {
  CreateSessionRequest,
  FeedbackRequest,
  TrainingSession,
  TrainingSessionPage,
  UpdateSessionRequest,
} from "@/types/TrainingSession";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type {
  CreateSessionRequest,
  FeedbackRequest,
  TrainingSession,
  TrainingSessionPage,
  UpdateSessionRequest,
} from "@/types/TrainingSession";
const page = { page: 0, size: 10 };

async function list(path: string, params: Partial<PaginationParams> = {}) {
  return api.get<TrainingSessionPage>(path, {
    params: { ...page, ...params },
  });
}

export const trainingSessionService = {
  getMine: (params?: Partial<PaginationParams>) =>
    list("/training/sessions/me", params),
  getPt: (params?: Partial<PaginationParams>) =>
    list("/training/sessions/pt", params),
  async getDetail(id: number) {
    return api.get<TrainingSession>(`/training/sessions/${id}`);
  },
  async create(payload: CreateSessionRequest) {
    return api.post<TrainingSession, CreateSessionRequest>(
      "/training/sessions",
      payload,
    );
  },
  async update(id: number, payload: UpdateSessionRequest) {
    return api.put<TrainingSession, UpdateSessionRequest>(
      `/training/sessions/${id}`,
      payload,
    );
  },
  async feedback(id: number, payload: FeedbackRequest) {
    return api.put<TrainingSession, FeedbackRequest>(
      `/training/sessions/${id}/feedback`,
      payload,
    );
  },
};
