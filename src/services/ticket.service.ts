import { api } from "@/services/api";
import type {
  GymCalendarDay,
  GymServiceItem,
  GymServiceRequest,
  MarketplaceTicketTypeParams,
  MarketplaceTicketTypePage,
  PaymentOrder,
  PtAvailabilitySaveResult,
  PtAvailabilitySlot,
  PtSlotCell,
  ScheduleTicketRequest,
  Ticket,
  TicketExpiryConfig,
  TicketPage,
  TicketPurchaseResult,
  TicketQuote,
  TicketQuoteRequest,
  TicketRefund,
  TicketRefundPage,
  TicketRefundPreview,
  TicketStatus,
  TicketStatusHistoryEntry,
  TicketType,
  TicketTypeRequest,
  TrainingSession,
} from "@/types/Ticket";
import type { PaginationParams } from "@/shared/types/pagination.type";

export type * from "@/types/Ticket";

const defaultPage = { page: 0, size: 20 };

export type TicketListParams = Partial<PaginationParams> & {
  status?: TicketStatus;
};

/**
 * Contract BE (mô hình vé):
 * - Catalog:   /gym/ticket-types, /marketplace/branches/{id}/ticket-types
 * - Mua vé:    /tickets/quote|purchase|my|{id}(/payment|/history|/cancel|/schedule)
 * - Buổi tập:  /sessions/my, /sessions/{id}(/date|/pt|/check-in|/review)
 * - Tìm PT:    /pt-availability/search|grid
 * - Gym:       /gym/calendar, /gym/tickets, /gym/sessions/{id}/confirm-pt
 * - PT:        /pt/availability/daily, /pt/sessions
 * - Admin:     /admin/tickets, /admin/ticket-refunds, /admin/config/ticket-expiry
 */
export const ticketService = {
  // ---------------- Catalog (Gym) ----------------
  listTicketTypes: () => api.get<TicketType[]>("/gym/ticket-types"),

  createTicketType: (body: TicketTypeRequest) =>
    api.post<TicketType, TicketTypeRequest>("/gym/ticket-types", body),

  updateTicketType: (id: number, body: TicketTypeRequest) =>
    api.put<TicketType, TicketTypeRequest>(`/gym/ticket-types/${id}`, body),

  deactivateTicketType: (id: number) => api.delete<void>(`/gym/ticket-types/${id}`),

  setTicketTypeStatus: (id: number, status: TicketType["status"]) =>
    api.patch<TicketType, { status: TicketType["status"] }>(
      `/gym/ticket-types/${id}/catalog-status`,
      { status },
    ),

  // ---------------- Dịch vụ kèm vé (V82) ----------------
  listServices: () => api.get<GymServiceItem[]>("/gym/services"),

  createService: (body: GymServiceRequest) =>
    api.post<GymServiceItem, GymServiceRequest>("/gym/services", body),

  updateService: (id: number, body: GymServiceRequest) =>
    api.put<GymServiceItem, GymServiceRequest>(`/gym/services/${id}`, body),

  deactivateService: (id: number) => api.delete<void>(`/gym/services/${id}`),

  setServiceStatus: (id: number, status: GymServiceItem["status"]) =>
    api.patch<GymServiceItem, { status: GymServiceItem["status"] }>(
      `/gym/services/${id}/catalog-status`,
      { status },
    ),

  // ---------------- Catalog (công khai) ----------------
  listBranchTicketTypes: (branchId: number) =>
    api.get<TicketType[]>(`/marketplace/branches/${branchId}/ticket-types`),

  /** Dịch vụ kèm vé bán tại chi nhánh — dùng ở bước chọn dịch vụ khi mua. */
  listBranchServices: (branchId: number) =>
    api.get<GymServiceItem[]>(`/marketplace/branches/${branchId}/services`),

  /**
   * Duyệt vé toàn sàn — trang "Gói tập" (kind=PACKAGE) dùng cái này.
   *
   * Lọc và phân trang chạy ở BE trên TOÀN tập. Bản cũ của trang này phải tìm 100
   * gym rồi gọi catalog từng gym (fan-out 100 request) nên chỉ quét được một
   * phần sàn và phải hiện cảnh báo "mới quét N gym" — nay không còn.
   */
  searchTicketTypes: (params: MarketplaceTicketTypeParams = {}) =>
    api.get<MarketplaceTicketTypePage>("/marketplace/ticket-types", {
      params: { page: 0, size: 12, ...params },
    }),

  // ---------------- Mua vé ----------------
  quote: (body: TicketQuoteRequest) =>
    api.post<TicketQuote, TicketQuoteRequest>("/tickets/quote", body),

  purchase: (body: TicketQuoteRequest) =>
    api.post<TicketPurchaseResult, TicketQuoteRequest>("/tickets/purchase", body),

  myTickets: (params: TicketListParams = {}) =>
    api.get<TicketPage>("/tickets/my", { params: { ...defaultPage, ...params } }),

  detail: (id: number) => api.get<Ticket>(`/tickets/${id}`),

  payment: (id: number) => api.get<PaymentOrder>(`/tickets/${id}/payment`),

  history: (id: number) => api.get<TicketStatusHistoryEntry[]>(`/tickets/${id}/history`),

  cancelUnpaid: (id: number) => api.post<Ticket>(`/tickets/${id}/cancel`),

  // ---------------- Đặt lịch ----------------
  schedule: (id: number, body: ScheduleTicketRequest) =>
    api.post<Ticket, ScheduleTicketRequest>(`/tickets/${id}/schedule`, body),

  mySessions: (from: string, to: string) =>
    api.get<TrainingSession[]>("/sessions/my", { params: { from, to } }),

  updateSessionDate: (sessionId: number, date: string) =>
    api.put<TrainingSession, { date: string }>(`/sessions/${sessionId}/date`, { date }),

  setSessionPt: (sessionId: number, ptId: number, slotStart: string) =>
    api.put<TrainingSession, { ptId: number; slotStart: string }>(
      `/sessions/${sessionId}/pt`,
      { ptId, slotStart },
    ),

  removeSessionPt: (sessionId: number) =>
    api.delete<TrainingSession>(`/sessions/${sessionId}/pt`),

  checkIn: (sessionId: number) => api.post<TrainingSession>(`/sessions/${sessionId}/check-in`),

  // ---------------- Tìm PT (hai chiều) ----------------
  /** Chọn giờ trước: PT nào của chi nhánh rảnh đúng khung này. */
  searchPtSlots: (branchId: number, date: string, startTime: string) =>
    api.get<PtSlotCell[]>("/pt-availability/search", {
      params: { branchId, date, startTime },
    }),

  /** Chọn PT trước (ptId) hoặc lưới gộp toàn chi nhánh (bỏ ptId). */
  ptSlotGrid: (branchId: number, from: string, to: string, ptId?: number) =>
    api.get<PtSlotCell[]>("/pt-availability/grid", {
      params: { branchId, from, to, ...(ptId ? { ptId } : {}) },
    }),

  // ---------------- Hậu mãi ----------------
  requestRefund: (ticketId: number, reason: string) =>
    api.post<TicketRefund, { reason: string }>(`/tickets/${ticketId}/refund-request`, { reason }),

  myRefunds: (params: Partial<PaginationParams> = {}) =>
    api.get<TicketRefundPage>("/tickets/refunds", { params: { ...defaultPage, ...params } }),

  openDispute: (ticketId: number, reason: string, sessionId?: number) =>
    api.post<unknown, { reason: string }>(
      `/tickets/${ticketId}/disputes`,
      { reason },
      { params: sessionId ? { sessionId } : undefined },
    ),

  reviewGym: (ticketId: number, rating: number, comment?: string, mediaIds?: number[]) =>
    api.post(`/tickets/${ticketId}/review`, { rating, comment, mediaIds }),

  reviewPt: (sessionId: number, rating: number, comment?: string, mediaIds?: number[]) =>
    api.post(`/sessions/${sessionId}/review`, { rating, comment, mediaIds }),

  // ---------------- Gym ----------------
  gymCalendar: (branchId: number, from: string, to: string) =>
    api.get<GymCalendarDay[]>("/gym/calendar", { params: { branchId, from, to } }),

  gymTickets: (
    params: Partial<PaginationParams> & { branchId?: number; from?: string; to?: string } = {},
  ) => api.get<TicketPage>("/gym/tickets", { params: { ...defaultPage, ...params } }),

  confirmPtSession: (sessionId: number, evidenceUrl: string) =>
    api.post<TrainingSession, { evidenceUrl: string }>(
      `/gym/sessions/${sessionId}/confirm-pt`,
      { evidenceUrl },
    ),

  // ---------------- PT ----------------
  ptMySlots: (from: string, to: string) =>
    api.get<PtAvailabilitySlot[]>("/pt/availability/daily", { params: { from, to } }),

  ptSaveSlots: (from: string, to: string, slots: PtAvailabilitySlot[]) =>
    api.put<PtAvailabilitySaveResult, { from: string; to: string; slots: PtAvailabilitySlot[] }>(
      "/pt/availability/daily",
      { from, to, slots },
    ),

  ptSessions: (from: string, to: string) =>
    api.get<TrainingSession[]>("/pt/sessions", { params: { from, to } }),

  // ---------------- Admin ----------------
  adminTickets: (
    params: Partial<PaginationParams> & {
      status?: TicketStatus;
      gymProfileId?: number;
      customerUsername?: string;
    } = {},
  ) => api.get<TicketPage>("/admin/tickets", { params: { ...defaultPage, ...params } }),

  adminTicketDetail: (id: number) => api.get<Ticket>(`/admin/tickets/${id}`),

  adminRefunds: (params: Partial<PaginationParams> & { status?: TicketRefund["status"] } = {}) =>
    api.get<TicketRefundPage>("/admin/ticket-refunds", {
      params: { ...defaultPage, ...params },
    }),

  adminRefundPreview: (id: number) =>
    api.get<TicketRefundPreview>(`/admin/ticket-refunds/${id}/preview`),

  adminApproveRefund: (id: number, mode: "FULL" | "PARTIAL_ELAPSED", note?: string) =>
    api.post<TicketRefund, { mode: string; note?: string }>(
      `/admin/ticket-refunds/${id}/approve`,
      { mode, note },
    ),

  adminRejectRefund: (id: number, note: string) =>
    api.post<TicketRefund, { note: string }>(`/admin/ticket-refunds/${id}/reject`, { note }),

  getTicketExpiryConfig: () => api.get<TicketExpiryConfig>("/admin/config/ticket-expiry"),

  updateTicketExpiryConfig: (body: TicketExpiryConfig) =>
    api.put<TicketExpiryConfig, TicketExpiryConfig>("/admin/config/ticket-expiry", body),
};
