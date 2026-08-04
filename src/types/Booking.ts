import type { PageResponse } from "@/shared/types/api-response.type";

/** Vòng đời booking theo BE (UC-040). */
export type BookingStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING_GYM"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED";

/** BookingResponse của BE. */
export interface Booking {
  id: number;
  customerUsername?: string;
  gymId?: number;
  gymName?: string;
  branchId?: number;
  branchName?: string;
  serviceId?: number;
  serviceName?: string;
  packageId?: number;
  packageName?: string;
  ptId?: number;
  ptDisplayName?: string;
  customerPackageId?: number;
  checkedInAt?: string;
  startAt?: string;
  endAt?: string;
  status: BookingStatus;
  statusReason?: string;
  customerNote?: string;
  totalAmount?: number;
  // C-7 (audit 2026-07-17): BE trả 3 field giảm giá nhưng FE type thiếu —
  // khách áp voucher xong vẫn thấy giá cũ, số hiển thị ≠ số QR phải trả.
  discountAmount?: number;
  voucherCode?: string;
  loyaltyPointsUsed?: number;
  payableAmount?: number;
  lateCancellation?: boolean;
  createdAt?: string;
  /**
   * Sheet3 "yêu cầu hoàn tiền lỗi": chỉ HELD mới thật sự còn tiền để hoàn.
   * BE (RefundServiceImpl.open) chặn mọi giá trị khác bằng 409 INVALID_STATE
   * "No held funds for this booking" — FE phải gate bằng CÙNG điều kiện này,
   * nếu không nút "Yêu cầu hoàn tiền" hiện ra nhưng bấm vào chắc chắn lỗi.
   */
  settlementStatus?: SettlementStatus;
}

/** Trạng thái dòng tiền của một booking (BE: common.enums.SettlementStatus). */
export type SettlementStatus =
  | "HELD"
  | "REFUND_PENDING"
  | "RELEASED"
  | "REFUNDED";

/** UC-044 (C-2): hàng chờ khi slot bận. */
export interface WaitlistEntry {
  id?: number;
  customerUsername?: string;
  serviceId?: number;
  serviceName?: string;
  packageId?: number;
  packageName?: string;
  preferredStart?: string;
  note?: string;
  active?: boolean;
}

export interface WaitlistRequest {
  serviceId?: number;
  packageId?: number;
  preferredStart?: string;
  note?: string;
}

/** Tạo/cập nhật lựa chọn booking (UC-031/032) — đúng một trong serviceId/packageId/customerPackageId. */
export interface CreateBookingRequest {
  serviceId?: number;
  packageId?: number;
  customerPackageId?: number;
  branchId?: number;
  ptId?: number;
  startAt?: string;
  endAt?: string;
  note?: string;
}

/** Hiệu chỉnh điểm danh (UC-050). */
export interface CorrectAttendanceRequest {
  checkedInAt?: string;
  clearCheckIn?: boolean;
  status?: BookingStatus;
  reason: string;
}

export type CustomerPackageStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED";

/** Gói tập khách đã mua (UC-049/051). */
export interface CustomerPackage {
  id: number;
  packageId?: number;
  packageName?: string;
  gymId?: number;
  gymName?: string;
  purchaseBookingId?: number;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  expiresAt?: string;
  status: CustomerPackageStatus;
}

/** Ghi chú buổi tập (UC-048/051). */
export interface SessionNote {
  id: number;
  bookingId: number;
  note: string;
  evidenceUrl?: string;
  author?: string;
  createdAt?: string;
}

export interface RescheduleBookingRequest {
  startAt: string;
  endAt: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

/** Một dòng lịch sử trạng thái (UC-040). */
export interface BookingHistoryEntry {
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  reason?: string;
  changedBy?: string;
  changedAt?: string;
}

export type PaymentOrderStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";

/** Đơn thanh toán VietQR (UC-052). qrContent là URL ảnh QR. */
export interface PaymentOrder {
  id: number;
  bookingId: number;
  refCode: string;
  amount: number;
  status: PaymentOrderStatus;
  qrContent?: string;
  paidAt?: string;
  expiresAt?: string;
}

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";

/** Yêu cầu hoàn tiền (UC-055/056). */
export interface RefundRequest {
  id: number;
  bookingId: number;
  amount: number;
  reason?: string;
  status: RefundStatus;
  decisionNote?: string;
  requestedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingPage = PageResponse<Booking>;
export type RefundPage = PageResponse<RefundRequest>;
