import { api } from "@/services/api";
import type { ApiResponse } from "@/shared/types/api-response.type";

export interface HealthPayload {
  status?: string;
  /**
   * BUG-11: endpoint mô phỏng thanh toán chỉ tồn tại khi BE chạy profile
   * local/dev. FE PHẢI hỏi cờ này thay vì đoán theo biến env của riêng mình —
   * đoán sai thì nút hiện ra nhưng bấm vào là 404.
   */
  paymentSimulatorEnabled?: boolean;
}

export type HealthResponse = ApiResponse<HealthPayload>;

export const healthService = {
  async getHealth(): Promise<HealthResponse> {
    return api.raw<HealthResponse>("/health");
  },
  /** Chỉ phần dữ liệu, đã bóc envelope — dùng cho useQuery. */
  getCapabilities: () => api.get<HealthPayload>("/health"),
};
