import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";

type S = components["schemas"];
export type Measurement = S["BodyMeasurementResponse"];
export type BodyMeasurementRequest = S["BodyMeasurementRequest"];

export const measurementService = {
  async getMine(page = 0) {
    const response = await axiosClient.get<S["ApiResponsePagedResponseBodyMeasurementResponse"]>(
      "/training/measurements/me",
      { params: { page, size: 20 } },
    );
    return unwrapApiData(response.data);
  },
  async getByCustomer(customerId: number) {
    const response = await axiosClient.get<S["ApiResponseListBodyMeasurementResponse"]>(
      `/training/measurements/customer/${customerId}`,
    );
    return unwrapApiData(response.data);
  },
  async create(payload: BodyMeasurementRequest) {
    const response = await axiosClient.post<S["ApiResponseBodyMeasurementResponse"]>(
      "/training/measurements",
      payload,
    );
    return unwrapApiData(response.data);
  },
};
