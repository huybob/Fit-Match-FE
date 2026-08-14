/**
 * Tiện ích ngày cho lịch đặt — TẤT CẢ theo giờ ĐỊA PHƯƠNG.
 *
 * Không dùng `Date.toISOString().slice(0, 10)` ở bất kỳ đâu trong luồng lịch:
 * `new Date("2026-08-15T00:00:00")` là nửa đêm GIỜ MÁY, đổi sang ISO (UTC) ở
 * UTC+7 thành `2026-08-14T17:00:00Z` nên cắt ra được "2026-08-14" — LÙI MỘT
 * NGÀY. Bản cũ của trang đặt lịch dính đúng lỗi này: chọn 15/8 thì ngày gửi lên
 * server là 14/8, và không có gì báo sai vì 14/8 vẫn là một ngày hợp lệ.
 */

/** Ngày ISO (YYYY-MM-DD) theo lịch địa phương. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse "YYYY-MM-DD" thành Date nửa đêm địa phương. */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, amount: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

export function addMonths(iso: string, amount: number): string {
  const date = fromIsoDate(iso);
  // Đặt về ngày 1 trước khi cộng tháng: 31/1 cộng 1 tháng mà giữ nguyên ngày sẽ
  // tràn sang 3/3 (vì tháng 2 không có ngày 31) và làm nhảy cóc một tháng.
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toIsoDate(date);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/**
 * Số ngày từ hôm nay tới `iso`: 0 = hết hạn hôm nay, âm = đã quá hạn.
 *
 * So sánh trên hai mốc nửa đêm địa phương chứ không lấy hiệu hai `Date.now()` —
 * kiểu sau cho ra 0.9 ngày rồi làm tròn thành 0 với một hạn còn nguyên cả ngày
 * mai, tuỳ theo lúc trong ngày người dùng mở trang.
 */
export function daysUntil(iso: string): number {
  const target = fromIsoDate(iso).getTime();
  const today = fromIsoDate(todayIso()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/** Thứ Hai của tuần chứa `iso` — lịch VN bắt đầu từ thứ Hai. */
export function startOfWeek(iso: string): string {
  const date = fromIsoDate(iso);
  const shift = (date.getDay() + 6) % 7; // CN(0) -> 6, T2(1) -> 0
  date.setDate(date.getDate() - shift);
  return toIsoDate(date);
}

export function startOfMonth(iso: string): string {
  const date = fromIsoDate(iso);
  date.setDate(1);
  return toIsoDate(date);
}

/** dayOfWeek theo quy ước BE/i18n: 1 = Thứ Hai … 7 = Chủ Nhật. */
export function isoWeekday(iso: string): number {
  const day = fromIsoDate(iso).getDay();
  return day === 0 ? 7 : day;
}

export function isSameMonth(iso: string, other: string): boolean {
  return iso.slice(0, 7) === other.slice(0, 7);
}

/**
 * Khoảng ngày đang hiển thị. Lịch tháng luôn vẽ đủ 6 hàng × 7 cột nên khoảng
 * này TRÀN sang tháng trước/sau — phải nạp dữ liệu đúng khoảng đó, không phải
 * chỉ mùng 1 đến cuối tháng, nếu không mấy ô đầu/cuối lưới sẽ trống oan.
 */
export function periodRange(view: "month" | "week", anchor: string) {
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }
  const from = startOfWeek(startOfMonth(anchor));
  return { from, to: addDays(from, 41) };
}

/** Các ngày trong lưới, theo đúng thứ tự vẽ. */
export function periodDays(view: "month" | "week", anchor: string): string[] {
  const { from } = periodRange(view, anchor);
  const count = view === "week" ? 7 : 42;
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

/** Vé DAY = 1 ngày; vé PACKAGE = dayCount ngày lịch LIÊN TIẾP (câu 27). */
export function plannedDays(startDate: string, dayCount: number): string[] {
  if (!startDate) return [];
  return Array.from({ length: Math.max(dayCount, 1) }, (_, i) => addDays(startDate, i));
}
