import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

export type LoyaltyTxnType = "EARN" | "REDEEM" | "REFUND";

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTxnType;
  points: number;
  balanceAfter: number;
  ticketId?: number;
  description?: string;
  createdAt?: string;
}

export interface LoyaltyBalance {
  pointsBalance: number;
  pointValue: number;
  vndPerPoint: number;
  history: PageResponse<LoyaltyTransaction>;
}

export const loyaltyService = {
  balance: () => api.get<LoyaltyBalance>("/loyalty"),
  apply: (ticketId: number, points: number) =>
    api.post(`/tickets/${ticketId}/loyalty`, { points }),
  remove: (ticketId: number) => api.deleteRaw(`/tickets/${ticketId}/loyalty`),
};
