import type { TicketListParams } from "@/services/ticket.service";

export const ticketKeys = {
  all: ["tickets"] as const,
  types: () => [...ticketKeys.all, "types"] as const,
  branchTypes: (branchId: number) => [...ticketKeys.all, "branch-types", branchId] as const,
  branchServices: (branchId: number) =>
    [...ticketKeys.all, "branch-services", branchId] as const,
  quote: (payload: unknown) => [...ticketKeys.all, "quote", payload] as const,
  myList: (params: TicketListParams) => [...ticketKeys.all, "my", params] as const,
  detail: (id: number) => [...ticketKeys.all, "detail", id] as const,
  payment: (id: number) => [...ticketKeys.all, "payment", id] as const,
  history: (id: number) => [...ticketKeys.all, "history", id] as const,
  refunds: () => [...ticketKeys.all, "refunds"] as const,
};

export const sessionKeys = {
  all: ["sessions"] as const,
  mine: (from: string, to: string) => [...sessionKeys.all, "mine", from, to] as const,
  pt: (from: string, to: string) => [...sessionKeys.all, "pt", from, to] as const,
  /** V94: báo giá huỷ một buổi — nằm dưới `all` để mọi thao tác lịch đều làm mới nó. */
  cancelQuote: (sessionId: number) => [...sessionKeys.all, "cancel-quote", sessionId] as const,
};

/**
 * Lưới chọn PT của khách. Contract BE không đổi ở V85 (vẫn /pt-availability/*),
 * chỉ nguồn dữ liệu đổi sang ca đã xếp — nên key giữ nguyên tên. `mine` bị bỏ
 * vì PT không còn khai lịch (xem trainerKeys.shifts).
 */
export const ptAvailabilityKeys = {
  all: ["pt-availability"] as const,
  /**
   * `minutes` nằm trong key: cùng một chi nhánh và khoảng ngày nhưng vé 60 phút
   * và vé 120 phút cho ra hai lưới khác hẳn nhau (khung bắt đầu khác, endTime
   * khác). Thiếu nó thì đổi vé giữa chừng sẽ dùng lại lưới của vé trước.
   */
  grid: (branchId: number, from: string, to: string, ptId?: number, minutes?: number) =>
    [...ptAvailabilityKeys.all, "grid", branchId, from, to, ptId ?? null,
      minutes ?? null] as const,
  search: (branchId: number, date: string, startTime: string, minutes?: number) =>
    [...ptAvailabilityKeys.all, "search", branchId, date, startTime, minutes ?? null] as const,
};

/** Buổi tập mất PT, đang chờ khách quyết (BE §4.1). */
export const ptCancellationKeys = {
  all: ["pt-cancellations"] as const,
  mine: () => [...ptCancellationKeys.all, "mine"] as const,
};

export const gymCalendarKeys = {
  all: ["gym-calendar"] as const,
  range: (branchId: number, from: string, to: string) =>
    [...gymCalendarKeys.all, branchId, from, to] as const,
};
