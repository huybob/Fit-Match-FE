import type { PageResponse } from "@/shared/types/api-response.type";

export interface Booking {
  id?: number;
  customerId?: number;
  customerName?: string;
  branchId?: number;
  branchName?: string;
  gymId?: number;
  gymName?: string;
  ptServiceId?: number;
  ptServiceName?: string;
  ptProfileId?: number;
  ptName?: string;
  price?: number;
  durationMinutes?: number;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: "DRAFT" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  cancellationReason?: string;
  cancellationTime?: string;
  cancelledBy?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  branchId: number;
  ptServiceId: number;
  bookingDate: string;
  startTime: string;
  notes?: string;
}

export interface BookingActionRequest {
  message?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export type BookingPage = PageResponse<Booking>;
export type BookingStatus = NonNullable<Booking["status"]>;
