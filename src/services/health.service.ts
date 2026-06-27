import { api } from "@/services/api";
import type { ApiResponse } from "@/shared/types/api-response.type";

export type HealthResponse = ApiResponse<Record<string, string>>;

export const healthService = {
  async getHealth(): Promise<HealthResponse> {
    return api.raw<HealthResponse>("/health");
  },
};
