import { axiosClient } from "@/core/http/axios-client";
import type { components } from "@/services/generated/api-contracts";

export type HealthResponse = components["schemas"]["ApiResponseMapStringString"];

export const healthService = {
  async getHealth(): Promise<HealthResponse> {
    const response = await axiosClient.get<HealthResponse>("/health");
    return response.data;
  },
};
