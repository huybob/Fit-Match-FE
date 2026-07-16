import { api } from "@/services/api";
import type {
  Booking,
  BookingHistoryEntry,
  BookingPage,
  BookingStatus,
  CancelBookingRequest,
  CreateBookingRequest,
  PaymentOrder,
  RefundPage,
  RescheduleBookingRequest,
} from "@/types/Booking";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type {
  Booking,
  BookingHistoryEntry,
  BookingPage,
  BookingStatus,
  CancelBookingRequest,
  CreateBookingRequest,
  PaymentOrder,
  RefundRequest,
  RescheduleBookingRequest,
} from "@/types/Booking";

export type BookingListParams = Partial<PaginationParams> & {
  status?: BookingStatus;
};

const defaultPage = { page: 0, size: 10 };

function list(path: string, params: BookingListParams = {}) {
  return api.get<BookingPage>(path, { params: { ...defaultPage, ...params } });
}

/**
 * Contract BE hiện tại:
 * - Customer:  /bookings/my, /bookings/{id}(/history|/payment|/checkout|/selection|/reschedule|/cancel|/refund-request), /bookings/refunds
 * - Gym:       /gym/bookings, /gym/bookings/{id}(/accept|/reject|/assign-pt|/reschedule|/cancel|/no-show|/complete|/history)
 * - PT:        /pt/bookings (read-only)
 */
export const bookingService = {
  // ---- Customer (UC-031..045, 055) ----
  getMine: (params?: BookingListParams) => list("/bookings/my", params),
  getDetail: (id: number) => api.get<Booking>(`/bookings/${id}`),
  getHistory: (id: number) => api.get<BookingHistoryEntry[]>(`/bookings/${id}/history`),
  create: (payload: CreateBookingRequest) =>
    api.post<Booking, CreateBookingRequest>("/bookings", payload),
  updateSelection: (id: number, payload: CreateBookingRequest) =>
    api.put<Booking, CreateBookingRequest>(`/bookings/${id}/selection`, payload),
  checkout: (id: number) => api.post<Booking>(`/bookings/${id}/checkout`),
  getPayment: (id: number) => api.get<PaymentOrder>(`/bookings/${id}/payment`),
  reschedule: (id: number, payload: RescheduleBookingRequest) =>
    api.post<Booking, RescheduleBookingRequest>(`/bookings/${id}/reschedule`, payload),
  cancel: (id: number, payload: CancelBookingRequest = {}) =>
    api.post<Booking, CancelBookingRequest>(`/bookings/${id}/cancel`, payload),
  requestRefund: (id: number, reason: string) =>
    api.post<unknown, { reason: string }>(`/bookings/${id}/refund-request`, { reason }),
  myRefunds: (params?: BookingListParams) =>
    api.get<RefundPage>("/bookings/refunds", { params: { ...defaultPage, ...params } }),

  // ---- Gym operator (UC-037..039, 041..043, 049) ----
  getGym: (params?: BookingListParams) => list("/gym/bookings", params),
  getGymDetail: (id: number) => api.get<Booking>(`/gym/bookings/${id}`),
  getGymHistory: (id: number) => api.get<BookingHistoryEntry[]>(`/gym/bookings/${id}/history`),
  accept: (id: number, ptId?: number) =>
    api.post<Booking, { ptId?: number }>(`/gym/bookings/${id}/accept`, { ptId }),
  reject: (id: number, reason: string) =>
    api.post<Booking, { reason: string }>(`/gym/bookings/${id}/reject`, { reason }),
  assignPt: (id: number, ptId: number) =>
    api.post<Booking, { ptId: number }>(`/gym/bookings/${id}/assign-pt`, { ptId }),
  gymReschedule: (id: number, payload: RescheduleBookingRequest) =>
    api.post<Booking, RescheduleBookingRequest>(`/gym/bookings/${id}/reschedule`, payload),
  gymCancel: (id: number, reason: string) =>
    api.post<Booking, { reason: string }>(`/gym/bookings/${id}/cancel`, { reason }),
  noShow: (id: number) => api.post<Booking>(`/gym/bookings/${id}/no-show`),
  complete: (id: number) => api.post<Booking>(`/gym/bookings/${id}/complete`),

  // ---- PT (read-only) ----
  getPt: (params?: BookingListParams) => list("/pt/bookings", params),
};
