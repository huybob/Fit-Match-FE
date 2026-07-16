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
  payableAmount?: number;
  lateCancellation?: boolean;
  createdAt?: string;
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

// ── Waitlist (UC-044) ──

/** Truyền đúng MỘT trong serviceId/packageId. */
export interface WaitlistRequest {
  serviceId?: number | null;
  packageId?: number | null;
  /** ISO datetime khung giờ mong muốn. */
  preferredStart?: string;
  note?: string;
}

export interface WaitlistEntry {
  id: number;
  customerUsername?: string;
  serviceId?: number | null;
  serviceName?: string | null;
  packageId?: number | null;
  packageName?: string | null;
  preferredStart?: string;
  note?: string;
  active?: boolean;
}

// ── Availability pre-check (UC-030) ──

/** Cần ít nhất một trong ptId/branchId. */
export interface AvailabilityCheckRequest {
  ptId?: number | null;
  branchId?: number | null;
  /** ISO datetime. */
  startAt: string;
  endAt: string;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  reasons: string[];
}
