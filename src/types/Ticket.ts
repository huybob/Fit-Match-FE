import type { PaginatedResult } from "@/shared/types/pagination.type";

/** Vé một ngày (dayCount = 1) hoặc vé gói n ngày liên tiếp. */
export type TicketKind = "DAY" | "PACKAGE";

export type TicketStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "USED_UP"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";

/** Không còn NO_SHOW: buổi tiêu theo ngày, bất kể khách có mặt hay không. */
export type SessionStatus = "SCHEDULED" | "DONE" | "CANCELLED";

export type CatalogStatus = "PUBLISHED" | "HIDDEN" | "PAUSED" | "ARCHIVED";

export type SettlementStatus =
  | "NONE"
  | "HELD"
  | "REFUND_PENDING"
  | "PENDING_RELEASE"
  | "DISPUTED"
  | "RELEASED"
  | "REFUNDED";

export type RefundMode = "FULL" | "PARTIAL_ELAPSED";

export type ReviewTargetType = "GYM" | "PT";

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface TicketTypeBranchRef {
  id: number;
  name: string;
}

export interface TicketType {
  id: number;
  name: string;
  description?: string | null;
  kind: TicketKind;
  dayCount: number;
  price: number;
  ptSurchargePerDay?: number | null;
  /** BE tính sẵn = price + ptSurchargePerDay * dayCount. Không nhân lại ở FE. */
  priceWithPt: number;
  status: CatalogStatus;
  active: boolean;
  branches: TicketTypeBranchRef[];
}

/**
 * Một loại vé trong trang duyệt toàn sàn. Khác {@link TicketType} (catalog của
 * chính gym) ở chỗ nó phải tự mang thông tin gym: item đứng một mình giữa danh
 * sách nhiều phòng gym, và không có `branches` thì không dựng được liên kết mua.
 */
export interface MarketplaceTicketType {
  id: number;
  name: string;
  description?: string | null;
  kind: TicketKind;
  dayCount: number;
  price: number;
  ptSurchargePerDay?: number | null;
  priceWithPt: number;
  gymId: number;
  gymName: string;
  gymCity?: string | null;
  gymDistrict?: string | null;
  branches: TicketTypeBranchRef[];
}

export interface MarketplaceTicketTypeParams {
  /** Bỏ trống = cả vé ngày lẫn vé gói. */
  kind?: TicketKind;
  keyword?: string;
  city?: string;
  district?: string;
  /** Theo giá NIÊM YẾT, chưa cộng phụ phí PT. */
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  /** Spring Pageable, ví dụ "price,asc". */
  sort?: string;
}

export interface TicketTypeRequest {
  name: string;
  description?: string;
  kind: TicketKind;
  dayCount?: number;
  price: number;
  ptSurchargePerDay?: number;
  branchIds: number[];
}

// ---------------------------------------------------------------------------
// Mua vé
// ---------------------------------------------------------------------------

/** V82: dịch vụ kèm vé — add-on cộng tiền MỘT LẦN, không nhân theo số ngày. */
export interface GymServiceItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  status: CatalogStatus;
  active: boolean;
}

export interface GymServiceRequest {
  name: string;
  description?: string;
  price: number;
}

export interface TicketQuoteRequest {
  branchId: number;
  ticketTypeId: number;
  withPt: boolean;
  voucherCode?: string;
  useLoyaltyPoints: boolean;
  /**
   * V82: dịch vụ khách tick thêm. Phải gửi ở CẢ quote lẫn purchase — FE không
   * được tự cộng tiền dịch vụ vì payableAmount do BE chốt chính là số in lên
   * VietQR; lệch một đồng là webhook thấy "trả thiếu" và vé không kích hoạt.
   */
  serviceIds?: number[];
}

export interface TicketQuoteServiceLine {
  id: number;
  name: string;
  price: number;
}

export interface TicketQuote {
  ticketTypeName: string;
  dayCount: number;
  withPt: boolean;
  /** = baseAmount + ptSurchargeAmount + servicesAmount, chưa trừ giảm giá. */
  totalAmount: number;
  /**
   * Tiền của riêng tấm vé (chưa phụ phí PT, chưa dịch vụ). Optional vì BE cũ hơn
   * chưa trả — ConfirmStep có nhánh suy ra để bảng kê vẫn cộng khớp.
   */
  baseAmount?: number | null;
  /** Phụ phí PT của cả vé, BE đã nhân số ngày. 0 = không chọn PT. */
  ptSurchargeAmount?: number | null;
  /** V82: tổng tiền dịch vụ, đã nằm trong totalAmount. */
  servicesAmount?: number | null;
  services?: TicketQuoteServiceLine[] | null;
  voucherDiscount: number;
  voucherCode?: string | null;
  /** Lý do mã không áp được — hiện dưới ô nhập, KHÔNG chặn xem giá. */
  voucherMessage?: string | null;
  loyaltyPointsAvailable: number;
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  payableAmount: number;
}

export interface PaymentOrder {
  id: number;
  ticketId?: number | null;
  refCode: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
  qrContent?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
}

export interface TrainingSession {
  id: number;
  ticketId: number;
  dayIndex: number;
  sessionDate: string;
  status: SessionStatus;
  ptProfileId?: number | null;
  ptName?: string | null;
  ptSlotStart?: string | null;
  ptSlotEnd?: string | null;
  checkedInAt?: string | null;
  ptConfirmedAt?: string | null;
  evidenceUrl?: string | null;
  /**
   * Chỉ có ở lịch dạy của PT (`/pt/sessions`). Buổi tập vốn chỉ mang ticketId,
   * mà PT nhìn "vé #123" thì không biết mình dạy ai.
   */
  customerName?: string | null;
}

export interface Ticket {
  id: number;
  customerId: number;
  customerName: string;
  ticketTypeId: number;
  ticketTypeName: string;
  gymProfileId: number;
  gymName: string;
  gymBranchId: number;
  gymBranchName: string;
  kind: TicketKind;
  dayCount: number;
  withPt: boolean;
  unitPrice: number;
  ptSurchargePerDay?: number | null;
  totalAmount: number;
  discountAmount?: number | null;
  loyaltyPointsUsed?: number | null;
  payableAmount: number;
  status: TicketStatus;
  statusReason?: string | null;
  /**
   * Ngày TẠO vé. Mốc duy nhất luôn có nên "Vé của tôi" sắp theo nó (mới nhất
   * trước) và hiển thị nó; purchasedAt chỉ có sau khi thanh toán xong.
   */
  createdAt?: string | null;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  startDate?: string | null;
  settlementStatus: SettlementStatus;
  /**
   * D-18: ngày cuối còn mở được tranh chấp (YYYY-MM-DD). null = chưa tới hạn (vé
   * chưa kết toán) hoặc hệ thống không áp hạn. Server tính theo cấu hình runtime
   * — đừng suy ra ở FE bằng hằng số, hai bên sẽ lệch ngay khi admin đổi cấu hình.
   */
  disputeDeadline?: string | null;
  scheduledDays?: number | null;
  sessions?: TrainingSession[] | null;
}

export interface TicketPurchaseResult {
  ticket: Ticket;
  /** null = điểm/voucher phủ hết, vé ACTIVE ngay và không hiện QR. */
  paymentOrder?: PaymentOrder | null;
}

export interface TicketStatusHistoryEntry {
  id: number;
  fromStatus?: TicketStatus | null;
  toStatus: TicketStatus;
  reason?: string | null;
  actor?: string | null;
  at: string;
}

// ---------------------------------------------------------------------------
// Đặt lịch
// ---------------------------------------------------------------------------

export interface ScheduleDayPt {
  dayIndex: number;
  ptId?: number | null;
  slotStart?: string | null;
}

export interface ScheduleTicketRequest {
  /** Vé DAY. */
  date?: string;
  ptId?: number | null;
  slotStart?: string | null;
  /** Vé PACKAGE — server sinh dayCount ngày liên tiếp từ đây. */
  startDate?: string;
  days?: ScheduleDayPt[];
}

/** Một ô của lưới ngày × giờ ở màn chọn PT. */
export interface PtSlotCell {
  ptProfileId: number;
  ptName?: string | null;
  ptAvgRating?: number | null;
  date: string;
  startTime: string;
  endTime: string;
  /** true = đã có người đặt; hiển thị mờ, không bấm được. */
  taken: boolean;
}

/**
 * BE §4.1: buổi tập mất PT vì đơn nghỉ được duyệt. Buổi VẪN là SCHEDULED (vé có
 * giá trị cả ngày), chỉ còn treo một quyết định của khách: chọn PT thay thế hay
 * nhận hoàn phụ phí HLV của ngày đó.
 */
export type PtCancellationStatus = "PENDING_CUSTOMER" | "REPLACED" | "REFUNDED";

export interface SessionPtCancellation {
  id: number;
  sessionId: number;
  sessionDate: string;
  formerPtProfileId?: number | null;
  formerPtName?: string | null;
  formerSlotStart?: string | null;
  formerSlotEnd?: string | null;
  status: PtCancellationStatus;
  /** Số tiền sẽ hoàn nếu chọn hoàn; 0 = voucher/điểm đã phủ hết vé, chỉ còn đường đổi PT. */
  estimatedRefund?: number | null;
  refundAmount?: number | null;
  resolvedAt?: string | null;
}

// ---------------------------------------------------------------------------
// Lịch gym
// ---------------------------------------------------------------------------

export interface GymCalendarEntry {
  sessionId: number;
  ticketId: number;
  customerName: string;
  ticketKind: TicketKind;
  ticketName: string;
  dayIndex: number;
  dayCount: number;
  ptName?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  checkedIn: boolean;
  ptConfirmed: boolean;
}

export interface GymCalendarDay {
  date: string;
  sessions: GymCalendarEntry[];
}

// ---------------------------------------------------------------------------
// Hoàn tiền
// ---------------------------------------------------------------------------

export interface TicketRefund {
  id: number;
  ticketId?: number | null;
  ticketTypeName?: string | null;
  amount: number;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";
  refundMode?: RefundMode | null;
  elapsedDays?: number | null;
  retainedAmount?: number | null;
  decisionNote?: string | null;
  requestedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface TicketRefundPreview {
  refundRequestId: number;
  ticketId: number;
  ticketTypeName: string;
  customerName: string;
  paidAmount: number;
  dayCount: number;
  startDate?: string | null;
  elapsedDays: number;
  fullRefund: number;
  partialRefund: number;
  retained: number;
  /** Câu 13: vé chưa dùng ngày nào -> chỉ hiện MỘT lựa chọn hoàn 100%. */
  fullRefundOnly: boolean;
  futureSessionsToCancel: number;
}

export interface TicketExpiryConfig {
  dayTicketExpiryDays: number;
  packageTicketExpiryDays: number;
}

export type TicketPage = PaginatedResult<Ticket>;
export type TicketRefundPage = PaginatedResult<TicketRefund>;
export type MarketplaceTicketTypePage = PaginatedResult<MarketplaceTicketType>;
