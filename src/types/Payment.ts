import type { PageResponse } from "@/shared/types/api-response.type";

export type PaymentMethod = "VNPAY" | "MOMO" | "BANK_TRANSFER" | "CASH";

export interface Payment {
  id?: number;
  bookingId?: number;
  customerId?: number;
  customerName?: string;
  ptProfileId?: number;
  ptName?: string;
  amount?: number;
  platformFee?: number;
  ptEarning?: number;
  status?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  paidAt?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  webhookRetryCount?: number;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentRequest {
  paymentMethod: PaymentMethod;
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

export type PaymentPage = PageResponse<Payment>;
export type PaymentStatus = NonNullable<Payment["status"]>;
