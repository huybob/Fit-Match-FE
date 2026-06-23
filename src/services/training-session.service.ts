import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
import type { PaginationParams } from "@/shared/types/pagination.type";

type S = components["schemas"];
export type TrainingSession = S["TrainingSessionResponse"];
export type TrainingSessionPage = S["PagedResponseTrainingSessionResponse"];
export type CreateSessionRequest = S["CreateSessionRequest"];
export type UpdateSessionRequest = S["UpdateSessionRequest"];
export type FeedbackRequest = S["FeedbackRequest"];
const page = { page: 0, size: 10 };

async function list(path: string, params: Partial<PaginationParams> = {}) {
  const response = await axiosClient.get<S["ApiResponsePagedResponseTrainingSessionResponse"]>(path, {
    params: { ...page, ...params },
  });
  return unwrapApiData(response.data);
}

export const trainingSessionService = {
  getMine: (params?: Partial<PaginationParams>) => list("/training/sessions/me", params),
  getPt: (params?: Partial<PaginationParams>) => list("/training/sessions/pt", params),
  async getDetail(id: number) {
    const response = await axiosClient.get<S["ApiResponseTrainingSessionResponse"]>(`/training/sessions/${id}`);
    return unwrapApiData(response.data);
  },
  async create(payload: CreateSessionRequest) {
    const response = await axiosClient.post<S["ApiResponseTrainingSessionResponse"]>("/training/sessions", payload);
    return unwrapApiData(response.data);
  },
  async update(id: number, payload: UpdateSessionRequest) {
    const response = await axiosClient.put<S["ApiResponseTrainingSessionResponse"]>(`/training/sessions/${id}`, payload);
    return unwrapApiData(response.data);
  },
  async feedback(id: number, payload: FeedbackRequest) {
    const response = await axiosClient.put<S["ApiResponseTrainingSessionResponse"]>(`/training/sessions/${id}/feedback`, payload);
    return unwrapApiData(response.data);
  },
};
