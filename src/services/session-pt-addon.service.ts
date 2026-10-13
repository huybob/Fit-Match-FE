import { api } from "@/services/api";
import type { PaymentOrder } from "@/types/Ticket";

export interface PtAddon {
  id: number;
  sessionId: number;
  status: "PENDING_PAYMENT" | "APPLIED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  amount: number;
  refundedAmount: number;
  holdExpiresAt: string;
  paymentNeedsReview?: boolean;
  paymentOrder?: PaymentOrder;
}
export interface PtAddonQuote { amount: number; cutoff: string; holdMinutes: number }
export interface PtAddonSelection { ptId: number; slotStart: string; expectedAmount?: number }
export const ptAddonService = {
  list: (sessionId: number) => api.get<PtAddon[]>(`/sessions/${sessionId}/pt-addons`),
  quote: (sessionId: number, body: PtAddonSelection) => api.post<PtAddonQuote>(`/sessions/${sessionId}/pt-addons/quote`, body),
  create: (sessionId: number, body: PtAddonSelection, key: string) =>
    api.post<PtAddon>(`/sessions/${sessionId}/pt-addons`, body, { headers: { "Idempotency-Key": key } }),
  cancel: (id: number) => api.post<PtAddon>(`/session-pt-addons/${id}/cancel`),
};
