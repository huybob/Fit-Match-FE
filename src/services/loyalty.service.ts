import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

export type LoyaltyTxnType = "EARN" | "REDEEM" | "REFUND";

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTxnType;
  points: number;
  balanceAfter: number;
  bookingId?: number;
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
  apply: (bookingId: number, points: number) =>
    api.post(`/bookings/${bookingId}/loyalty`, { points }),
  remove: (bookingId: number) => api.deleteRaw(`/bookings/${bookingId}/loyalty`),
};
