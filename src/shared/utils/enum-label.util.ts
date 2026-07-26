/**
 * Map giá trị enum của BE sang key i18n.
 *
 * Dùng chung để không phải khai báo lại bảng nhãn ở từng trang — trước đây mỗi
 * trang tự viết một `Record<Role, string>` bằng tiếng Việt/Anh khác nhau.
 */

/** Các key con của common.roles — dùng để kiểu hoá key i18n. */
export type RoleKey =
  | "admin"
  | "moderator"
  | "financeAdmin"
  | "pt"
  | "gymOperator"
  | "customer";

/** Role của BE -> key trong common.roles. */
export const ROLE_KEY: Record<string, RoleKey> = {
  ROLE_ADMIN: "admin",
  ROLE_MODERATOR: "moderator",
  ROLE_FINANCE_ADMIN: "financeAdmin",
  ROLE_PT: "pt",
  ROLE_GYM_OPERATOR: "gymOperator",
  ROLE_CUSTOMER: "customer",
};

/** Trả về key i18n đầy đủ cho một role; fallback về customer nếu lạ. */
export function roleLabelKey(role?: string | null): `common.roles.${RoleKey}` {
  return `common.roles.${ROLE_KEY[role ?? ""] ?? "customer"}`;
}

/**
 * Thứ tự hiển thị các trạng thái trong bộ lọc.
 * Chỉ chứa ID — phần nhãn nằm trong messages/*.json.
 */
export const BOOKING_STATUS_ORDER = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PENDING_GYM",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "NO_SHOW",
  "COMPLETED",
] as const;

export const REFUND_STATUS_ORDER = ["PENDING", "APPROVED", "REJECTED", "EXECUTED"] as const;

export const RECON_STATUS_ORDER = [
  "APPLIED",
  "NEEDS_REVIEW",
  "RESOLVED_APPLIED",
  "RESOLVED_REFUNDED",
  "RESOLVED_IGNORED",
] as const;

export const PAYMENT_ANOMALY_ORDER = [
  "UNMATCHED",
  "UNDERPAID",
  "OVERPAID",
  "LATE_ARRIVAL",
  "DUPLICATE",
] as const;

/** Khoá của common.weekday. */
export type WeekdayKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/**
 * dayOfWeek của BE (1 = Thứ 2 … 7 = Chủ nhật) -> key i18n.
 * Trước đây 3 file tự khai lại bảng nhãn thứ bằng tiếng Việt.
 */
export const WEEKDAY_KEY: Record<number, WeekdayKey> = {
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
  7: "SUN",
};

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 7] as const;

/** Key i18n đầy đủ cho một dayOfWeek. */
export function weekdayKey(day: number): `common.weekday.${WeekdayKey}` {
  return `common.weekday.${WEEKDAY_KEY[day] ?? "MON"}`;
}

/** Key i18n dạng viết tắt (T2, T3…) cho một dayOfWeek. */
export function weekdayShortKey(day: number): `common.weekdayShort.${WeekdayKey}` {
  return `common.weekdayShort.${WEEKDAY_KEY[day] ?? "MON"}`;
}
