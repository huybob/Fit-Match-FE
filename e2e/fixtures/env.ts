/**
 * Tham số môi trường của bộ e2e. Tách riêng để đổi cổng / schema mà không phải
 * sửa từng spec.
 *
 * Mặc định trỏ vào một backend + schema RIÊNG cho test (cổng 8090, DB
 * `fitmatch_e2e`), không đụng vào backend dev (8080) hay DB `fitmatch`.
 */
export const E2E = {
  apiUrl: process.env.E2E_API_URL ?? "http://localhost:8090/api",
  webUrl: process.env.E2E_WEB_URL ?? "http://localhost:3100",

  db: {
    host: process.env.E2E_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.E2E_DB_PORT ?? 3306),
    user: process.env.E2E_DB_USER ?? "root",
    password: process.env.E2E_DB_PASSWORD ?? "123456",
    database: process.env.E2E_DB_NAME ?? "fitmatch_e2e",
  },

  /** Phải khớp CASSO_WEBHOOK_SECRET của backend đang test. */
  cassoSecret: process.env.E2E_CASSO_SECRET ?? "e2e-webhook-secret",

  /** Tài khoản do DevDataSeeder tạo sẵn ở profile `local`. */
  accounts: {
    admin: { username: "admin", password: "Password123!" },
    gym: { username: "operator", password: "Password123!" },
    customer: { username: "customer", password: "Password123!" },
  },

  /** Tài khoản tạo trong lúc chạy test. */
  pt: { username: "pt.e2e", password: "Password123!", displayName: "PT E2E" },
  customer2: { username: "cust.e2e2", password: "Password123!" },
};

/** yyyy-MM-dd của hôm nay + n ngày, theo giờ máy (đã chốt Asia/Ho_Chi_Minh ở BE). */
export function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Ngày gần nhất từ hôm nay + minOffset trở đi rơi vào một thứ cụ thể (1=T2..7=CN). */
export function nextWeekday(isoDay: number, minOffset = 1): string {
  for (let i = minOffset; i < minOffset + 14; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const day = d.getDay() === 0 ? 7 : d.getDay();
    if (day === isoDay) return d.toISOString().slice(0, 10);
  }
  throw new Error(`Khong tim duoc thu ${isoDay}`);
}
