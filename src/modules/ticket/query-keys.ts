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
};

/**
 * Lưới chọn PT của khách. Contract BE không đổi ở V85 (vẫn /pt-availability/*),
 * chỉ nguồn dữ liệu đổi sang ca đã xếp — nên key giữ nguyên tên. `mine` bị bỏ
 * vì PT không còn khai lịch (xem trainerKeys.shifts).
 */
export const ptAvailabilityKeys = {
  all: ["pt-availability"] as const,
  grid: (branchId: number, from: string, to: string, ptId?: number) =>
    [...ptAvailabilityKeys.all, "grid", branchId, from, to, ptId ?? null] as const,
  search: (branchId: number, date: string, startTime: string) =>
    [...ptAvailabilityKeys.all, "search", branchId, date, startTime] as const,
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
