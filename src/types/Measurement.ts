import type { PageResponse } from "@/shared/types/api-response.type";

export interface Measurement {
  id?: number;
  customerId?: number;
  customerName?: string;
  measurementDate?: string;
  weight?: number;
  height?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  notes?: string;
  createdAt?: string;
}

export interface BodyMeasurementRequest {
  customerId: number;
  measurementDate: string;
  weight?: number;
  height?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  notes?: string;
}

export type MeasurementPage = PageResponse<Measurement>;
