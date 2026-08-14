import type { PageResponse } from "@/shared/types/api-response.type";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

/**
 * Loại chủ ví (V61) — quyết định endpoint và trang hiển thị.
 * PT không có ví: PT được phòng gym trả công ngoài nền tảng.
 */
export type WalletOwnerType = "GYM" | "CUSTOMER";

/** WithdrawalResponse của BE (UC-062, đa chủ ví từ V61). */
export interface Withdrawal {
  id: number;
  amount: number;
  /** Mã đối soát nhúng trong nội dung chuyển khoản — Casso khớp giao dịch CHI theo mã này. */
  refCode?: string;
  bankAccount?: string;
  bankName?: string;
  /** Mã BIN VietQR của ngân hàng thụ hưởng. */
  bankBin?: string;
  accountHolder?: string;
  status: WithdrawalStatus;
  reviewNote?: string;
  /** D-11: mã giao dịch chuyển khoản thực tế (bắt buộc khi mark-paid). */
  payoutReference?: string;
  /** Link ảnh QR để admin quét chuyển khoản; có sau khi lệnh được duyệt. */
  qrContent?: string;
  paidAt?: string;
  /** True khi PAID do webhook Casso tự khớp chứ không phải admin bấm tay. */
  autoMatched?: boolean;
  ownerType?: WalletOwnerType;
  ownerName?: string;
  requestedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Gửi yêu cầu rút tiền (tiền được giữ chỗ ngay khi tạo).
 * V61: chọn tài khoản đã lưu thay vì gõ tay — BE cần mã BIN để dựng QR.
 */
export interface WithdrawalRequestDto {
  amount: number;
  bankAccountId: number;
}

/** Ví 4 bucket (UC-061). Ví khách hàng chỉ dùng available + frozen. */
export interface Wallet {
  id: number;
  heldBalance: number;
  pendingBalance: number;
  availableBalance: number;
  frozenBalance: number;
}

/** WalletTxnType của BE — khớp enum + cột DB (V19/V31/V61). */
export type WalletTxnType =
  | "HOLD"
  | "REFUND"
  | "MOVE_TO_PENDING"
  | "RELEASE"
  | "COMMISSION"
  | "FREEZE"
  | "UNFREEZE"
  | "WITHDRAWAL"
  | "DISPUTE_HOLD"
  | "REFUND_CREDIT";

export interface WalletTransaction {
  id: number;
  type: WalletTxnType | string;
  amount: number;
  /** Neo vé của bút toán escrow (BE V73) — thay cho bookingId cũ. */
  ticketId?: number;
  description?: string;
  heldAfter: number;
  pendingAfter: number;
  availableAfter: number;
  frozenAfter: number;
  createdAt?: string;
}

/** Ngân hàng trong master data BE (V61) — thay cho mảng tên ngân hàng cũ ở FE. */
export interface Bank {
  id: number;
  bin: string;
  code: string;
  shortName: string;
  name: string;
}

/** Tài khoản ngân hàng thụ hưởng đã lưu. */
export interface BankAccount {
  id: number;
  bankId: number;
  bankBin: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultAccount: boolean;
}

export interface BankAccountDto {
  bankId: number;
  accountNumber: string;
  accountHolder: string;
  setDefault?: boolean;
}

export type WithdrawalPage = PageResponse<Withdrawal>;
export type WalletTransactionPage = PageResponse<WalletTransaction>;
