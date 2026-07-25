import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

/** UC-051: số đo cơ thể — khách tự theo dõi tiến trình tập luyện. */
export interface BodyMeasurement {
  id?: number;
  measuredAt?: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  note?: string;
  /** BE tính sẵn khi có đủ cân nặng + chiều cao. */
  bmi?: number;
  createdAt?: string;
}

export interface BodyMeasurementInput {
  measuredAt: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  note?: string;
}

export const measurementService = {
  list: (params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<BodyMeasurement>>("/measurements", {
      params: { page: 0, size: 50, ...params },
    }),
  create: (payload: BodyMeasurementInput) =>
    api.post<BodyMeasurement, BodyMeasurementInput>("/measurements", payload),
  update: (id: number, payload: BodyMeasurementInput) =>
    api.put<BodyMeasurement, BodyMeasurementInput>(`/measurements/${id}`, payload),
  remove: (id: number) => api.deleteRaw(`/measurements/${id}`),
};
