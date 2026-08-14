import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

export type DiscountType = "PERCENT" | "FIXED";

export interface Voucher {
  id: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom?: string;
  validTo?: string;
  active: boolean;
}

export interface VoucherRequest {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: string;
  validTo?: string;
  active?: boolean;
}

export const voucherService = {
  // ---- Admin (UC-073) ----
  list: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Voucher>>("/admin/vouchers", { params: { page: 0, size: 20, ...params } }),
  create: (payload: VoucherRequest) => api.post<Voucher, VoucherRequest>("/admin/vouchers", payload),
  update: (id: number, payload: VoucherRequest) =>
    api.put<Voucher, VoucherRequest>(`/admin/vouchers/${id}`, payload),
  setActive: (id: number, active: boolean) =>
    api.patch<Voucher>(`/admin/vouchers/${id}/active`, undefined, { params: { active } }),

  // ---- Customer apply on a draft booking ----
  apply: (ticketId: number, code: string) =>
    api.post(`/tickets/${ticketId}/voucher`, { code }),
  remove: (ticketId: number) => api.deleteRaw(`/tickets/${ticketId}/voucher`),
};
