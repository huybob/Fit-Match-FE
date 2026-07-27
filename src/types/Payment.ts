// Nội dung cũ của file này là type của mô hình PT độc lập + VNPAY/MoMo đã bỏ
// (Payment, ptEarning, webhookRetryCount, status COMPLETED/REFUNDED...) —
// không nơi nào import và không khớp BE thực tế (VietQR + đối soát Casso).
// Đã thay bằng type đối soát thanh toán thật (UC-053/056).

import type { BookingStatus, PaymentOrderStatus } from "@/types/Booking";

/** Trạng thái đối soát của một giao dịch ngân hàng (UC-053/056). */
export type ReconStatus =
  | "APPLIED"
  | "NEEDS_REVIEW"
  | "RESOLVED_APPLIED"
  | "RESOLVED_REFUNDED"
  | "RESOLVED_IGNORED";

/** Lý do giao dịch không đi trọn được luồng tự động; bỏ trống = khớp bình thường. */
export type PaymentTxnAnomaly =
  | "UNMATCHED"
  | "UNDERPAID"
  | "OVERPAID"
  | "LATE_ARRIVAL"
  | "DUPLICATE";

/** Giao dịch ngân hàng Casso gửi về, kèm kết quả đối soát (UC-053). */
export interface PaymentTransaction {
  id: number;
  /** Id giao dịch bên Casso — tra cứu ở sao kê ngân hàng. */
  externalId: string;
  amount: number;
  refCode?: string;
  rawDescription?: string;
  reconStatus: ReconStatus;
  anomaly?: PaymentTxnAnomaly;
  paymentOrderId?: number;
  orderAmount?: number;
  orderStatus?: PaymentOrderStatus;
  bookingId?: number;
  bookingStatus?: BookingStatus;
  customerUsername?: string;
  /** Dương = khách chuyển thừa, âm = chuyển thiếu. */
  amountDifference?: number;
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt?: string;
}

export interface ReconciliationAnomalyBucket {
  anomaly?: PaymentTxnAnomaly;
  count: number;
  amount: number;
}

/** Tổng quan tiền đã vào tài khoản nền tảng mà chưa gắn được vào booking. */
export interface ReconciliationSummary {
  needsReviewCount: number;
  needsReviewAmount: number;
  byAnomaly: ReconciliationAnomalyBucket[];
}

export interface ReconciliationApplyRequest {
  bookingId: number;
  /** Bỏ qua kiểm tra "giao dịch phải đủ số phải trả" (khách chuyển nhiều lần). */
  allowAmountMismatch?: boolean;
  note?: string;
}

export interface ReconciliationResolveRequest {
  resolution: "RESOLVED_REFUNDED" | "RESOLVED_IGNORED";
  note: string;
}
