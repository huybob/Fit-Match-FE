import type { PageResponse } from "@/shared/types/api-response.type";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

/** WithdrawalResponse của BE (UC-062). */
export interface Withdrawal {
  id: number;
  amount: number;
  bankAccount?: string;
  bankName?: string;
  accountHolder?: string;
  status: WithdrawalStatus;
  reviewNote?: string;
  requestedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Gym gửi yêu cầu rút tiền (tiền được giữ chỗ ngay khi tạo). */
export interface WithdrawalRequestDto {
  amount: number;
  bankAccount: string;
  bankName: string;
  accountHolder: string;
}

/** Ví gym 4 bucket (UC-061). */
export interface Wallet {
  id: number;
  heldBalance: number;
  pendingBalance: number;
  availableBalance: number;
  frozenBalance: number;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  bookingId?: number;
  description?: string;
  heldAfter: number;
  pendingAfter: number;
  availableAfter: number;
  frozenAfter: number;
  createdAt?: string;
}

export type WithdrawalPage = PageResponse<Withdrawal>;
export type WalletTransactionPage = PageResponse<WalletTransaction>;
