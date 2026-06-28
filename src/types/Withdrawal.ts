import type { PageResponse } from "@/shared/types/api-response.type";

export interface Withdrawal {
  id?: number;
  userId?: number;
  amount?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  notes?: string;
  rejectReason?: string;
  rejectionReason?: string;
  ptName?: string;
  approvedByName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface WithdrawalRequestDto {
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  notes?: string;
}

export interface RejectWithdrawalRequest {
  reason: string;
}

export type WithdrawalPage = PageResponse<Withdrawal>;
export type WithdrawalStatus = NonNullable<Withdrawal["status"]>;
