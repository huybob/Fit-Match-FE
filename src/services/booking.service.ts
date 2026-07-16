import { api } from "@/services/api";
import type {
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  Booking,
  BookingHistoryEntry,
  BookingPage,
  BookingStatus,
  CancelBookingRequest,
  CorrectAttendanceRequest,
  CreateBookingRequest,
  CustomerPackage,
  PaymentOrder,
  RefundPage,
  RescheduleBookingRequest,
  SessionNote,
  WaitlistEntry,
  WaitlistRequest,
} from "@/types/Booking";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type {
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  Booking,
  BookingHistoryEntry,
  BookingPage,
  BookingStatus,
  CancelBookingRequest,
  CorrectAttendanceRequest,
  CreateBookingRequest,
  CustomerPackage,
  PaymentOrder,
  RefundRequest,
  RescheduleBookingRequest,
  SessionNote,
  WaitlistEntry,
  WaitlistRequest,
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
 * - Customer:  /bookings/my, /bookings/{id}(/history|/payment|/checkout|/selection|/reschedule|/cancel|/refund-request), /bookings/refunds, /bookings/waitlist, /availability/check
 * - Gym:       /gym/bookings, /gym/bookings/{id}(/accept|/reject|/assign-pt|/reschedule|/cancel|/no-show|/complete|/history), /gym/bookings/waitlist
 * - PT:        /pt/bookings (read-only)
 * - Admin:     /admin/bookings, /admin/bookings/{id}(/history|/confirm-payment|/correct-attendance)
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
  checkIn: (id: number) => api.post<Booking>(`/bookings/${id}/check-in`),
  myPackages: () => api.get<CustomerPackage[]>("/bookings/my-packages"),
  notes: (id: number) => api.get<SessionNote[]>(`/bookings/${id}/notes`),
  checkAvailability: (payload: AvailabilityCheckRequest) =>
    api.post<AvailabilityCheckResponse, AvailabilityCheckRequest>("/availability/check", payload),
  joinWaitlist: (payload: WaitlistRequest) =>
    api.post<WaitlistEntry, WaitlistRequest>("/bookings/waitlist", payload),
  myWaitlist: () => api.get<WaitlistEntry[]>("/bookings/waitlist"),
  leaveWaitlist: (id: number) => api.deleteRaw(`/bookings/waitlist/${id}`),

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
  gymCheckIn: (id: number) => api.post<Booking>(`/gym/bookings/${id}/check-in`),
  correctAttendance: (id: number, payload: CorrectAttendanceRequest) =>
    api.post<Booking, CorrectAttendanceRequest>(`/gym/bookings/${id}/correct-attendance`, payload),
  gymNotes: (id: number) => api.get<SessionNote[]>(`/gym/bookings/${id}/notes`),
  addGymNote: (id: number, note: string, evidenceUrl?: string) =>
    api.post<SessionNote, { note: string; evidenceUrl?: string }>(
      `/gym/bookings/${id}/notes`, { note, evidenceUrl }),
  gymWaitlist: (params: { serviceId?: number; packageId?: number }) =>
    api.get<WaitlistEntry[]>("/gym/bookings/waitlist", { params }),

  // ---- PT ----
  getPt: (params?: BookingListParams) => list("/pt/bookings", params),
  ptCheckIn: (id: number) => api.post<Booking>(`/pt/bookings/${id}/check-in`),
  addPtNote: (id: number, note: string, evidenceUrl?: string) =>
    api.post<SessionNote, { note: string; evidenceUrl?: string }>(
      `/pt/bookings/${id}/notes`, { note, evidenceUrl }),

  // ---- Admin (UC-036, UC-045, UC-050) ----
  getAdmin: (params?: BookingListParams) => list("/admin/bookings", params),
  getAdminDetail: (id: number) => api.get<Booking>(`/admin/bookings/${id}`),
  getAdminHistory: (id: number) =>
    api.get<BookingHistoryEntry[]>(`/admin/bookings/${id}/history`),
  confirmPayment: (id: number) =>
    api.post<Booking>(`/admin/bookings/${id}/confirm-payment`),
  adminCorrectAttendance: (id: number, payload: CorrectAttendanceRequest) =>
    api.post<Booking, CorrectAttendanceRequest>(
      `/admin/bookings/${id}/correct-attendance`, payload),
};
