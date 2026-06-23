import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
import type { PaginationParams } from "@/shared/types/pagination.type";

type S = components["schemas"];
type GeneratedBooking = S["BookingResponse"];
type GeneratedCreateBooking = S["CreateBookingRequest"];

export type BookingStatus = NonNullable<GeneratedBooking["status"]>;
export type Booking = Omit<GeneratedBooking, "startTime" | "endTime"> & {
  startTime?: string;
  endTime?: string;
};
export type BookingPage = Omit<S["PagedResponseBookingResponse"], "content"> & {
  content?: Booking[];
};
export type CreateBookingRequest = Omit<GeneratedCreateBooking, "startTime"> & {
  startTime: string;
};
export type BookingActionRequest = S["BookingActionRequest"];
export type CancelBookingRequest = S["CancelBookingRequest"];

export type BookingListParams = Partial<PaginationParams> & {
  status?: BookingStatus;
  date?: string;
};

const defaultPage = { page: 0, size: 10 };

async function list(path: string, params: BookingListParams = {}) {
  const response = await axiosClient.get<S["ApiResponsePagedResponseBookingResponse"]>(path, {
    params: { ...defaultPage, ...params },
  });
  return unwrapApiData(response.data) as BookingPage;
}

async function action(path: string, payload?: unknown) {
  const response = await axiosClient.put<S["ApiResponseBookingResponse"]>(path, payload);
  return unwrapApiData(response.data) as Booking;
}

export const bookingService = {
  getMine: (params?: BookingListParams) => list("/bookings/me", params),
  getPt: (params?: BookingListParams) => list("/bookings/pt", params),
  getGym: (params?: BookingListParams) => list("/bookings/gym", params),
  async getDetail(id: number) {
    const response = await axiosClient.get<S["ApiResponseBookingResponse"]>(`/bookings/${id}`);
    return unwrapApiData(response.data) as Booking;
  },
  async create(payload: CreateBookingRequest) {
    const response = await axiosClient.post<S["ApiResponseBookingResponse"]>("/bookings", payload);
    return unwrapApiData(response.data) as Booking;
  },
  submit: (id: number) => action(`/bookings/${id}/submit`),
  confirm: (id: number, payload: BookingActionRequest = {}) => action(`/bookings/${id}/confirm`, payload),
  checkIn: (id: number) => action(`/bookings/${id}/check-in`),
  complete: (id: number) => action(`/bookings/${id}/complete`),
  noShow: (id: number) => action(`/bookings/${id}/no-show`),
  cancel: (id: number, payload: CancelBookingRequest) => action(`/bookings/${id}/cancel`, payload),
};
