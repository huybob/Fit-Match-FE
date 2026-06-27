import { api } from "@/services/api";
import type {
  Booking,
  BookingActionRequest,
  BookingPage,
  BookingStatus,
  CancelBookingRequest,
  CreateBookingRequest,
} from "@/types/Booking";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type {
  Booking,
  BookingActionRequest,
  BookingPage,
  BookingStatus,
  CancelBookingRequest,
  CreateBookingRequest,
} from "@/types/Booking";

export type BookingListParams = Partial<PaginationParams> & {
  status?: BookingStatus;
  date?: string;
};

const defaultPage = { page: 0, size: 10 };

async function list(path: string, params: BookingListParams = {}) {
  return api.get<BookingPage>(path, {
    params: { ...defaultPage, ...params },
  });
}

async function action(path: string, payload?: unknown) {
  return api.put<Booking>(path, payload);
}

export const bookingService = {
  getMine: (params?: BookingListParams) => list("/bookings/me", params),
  getPt: (params?: BookingListParams) => list("/bookings/pt", params),
  getGym: (params?: BookingListParams) => list("/bookings/gym", params),
  async getDetail(id: number) {
    return api.get<Booking>(`/bookings/${id}`);
  },
  async create(payload: CreateBookingRequest) {
    return api.post<Booking, CreateBookingRequest>("/bookings", payload);
  },
  submit: (id: number) => action(`/bookings/${id}/submit`),
  confirm: (id: number, payload: BookingActionRequest = {}) =>
    action(`/bookings/${id}/confirm`, payload),
  checkIn: (id: number) => action(`/bookings/${id}/check-in`),
  complete: (id: number) => action(`/bookings/${id}/complete`),
  noShow: (id: number) => action(`/bookings/${id}/no-show`),
  cancel: (id: number, payload: CancelBookingRequest) =>
    action(`/bookings/${id}/cancel`, payload),
};
