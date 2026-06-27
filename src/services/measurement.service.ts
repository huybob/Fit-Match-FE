import { api } from "@/services/api";
import type {
  BodyMeasurementRequest,
  Measurement,
  MeasurementPage,
} from "@/types/Measurement";

export type {
  BodyMeasurementRequest,
  Measurement,
  MeasurementPage,
} from "@/types/Measurement";

export const measurementService = {
  async getMine(page = 0) {
    return api.get<MeasurementPage>("/training/measurements/me", {
      params: { page, size: 20 },
    });
  },
  async getByCustomer(customerId: number) {
    return api.get<Measurement[]>(
      `/training/measurements/customer/${customerId}`,
    );
  },
  async create(payload: BodyMeasurementRequest) {
    return api.post<Measurement, BodyMeasurementRequest>(
      "/training/measurements",
      payload,
    );
  },
};
