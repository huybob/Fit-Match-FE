import type { PageResponse } from "@/shared/types/api-response.type";

export interface TrainingSession {
  id?: number;
  bookingId?: number;
  customerId?: number;
  customerName?: string;
  ptProfileId?: number;
  ptName?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status?: string;
  notes?: string;
  feedback?: string;
  [key: string]: unknown;
}

export interface CreateSessionRequest {
  bookingId?: number;
  customerId?: number;
  plannedStartTime?: string;
  plannedEndTime?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface UpdateSessionRequest {
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
}

export interface FeedbackRequest {
  rating?: number;
  feedback?: string;
  notes?: string;
}

export type TrainingSessionPage = PageResponse<TrainingSession>;
