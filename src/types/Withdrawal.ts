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
  /** D-11: mã giao dịch chuyển khoản thực tế (bắt buộc khi mark-paid). */
  payoutReference?: string;
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

/** WalletTxnType của BE — khớp enum + cột DB (V19/V31). */
export type WalletTxnType =
  | "HOLD"
  | "REFUND"
  | "MOVE_TO_PENDING"
  | "RELEASE"
  | "COMMISSION"
  | "FREEZE"
  | "UNFREEZE"
  | "WITHDRAWAL"
  | "DISPUTE_HOLD";

export interface WalletTransaction {
  id: number;
  type: WalletTxnType | string;
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
