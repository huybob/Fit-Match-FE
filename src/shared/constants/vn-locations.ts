/**
 * Bug 11 (UC-18): danh mục thành phố + quận/huyện chính cho bộ lọc vị trí
 * marketplace. Danh sách rút gọn theo các thành phố lớn có phòng gym.
 */
export interface VnCity {
  name: string;
  districts: string[];
}

export const VN_CITIES: VnCity[] = [
  {
    name: "Hà Nội",
    districts: [
      "Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Long Biên", "Cầu Giấy", "Đống Đa",
      "Hai Bà Trưng", "Hoàng Mai", "Thanh Xuân", "Hà Đông", "Nam Từ Liêm",
      "Bắc Từ Liêm", "Thanh Trì", "Gia Lâm", "Đông Anh",
    ],
  },
  {
    name: "TP. Hồ Chí Minh",
    districts: [
      "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8",
      "Quận 10", "Quận 11", "Quận 12", "Bình Thạnh", "Phú Nhuận", "Tân Bình",
      "Tân Phú", "Gò Vấp", "Bình Tân", "Thủ Đức",
    ],
  },
  {
    name: "Đà Nẵng",
    districts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ", "Hòa Vang"],
  },
  {
    name: "Hải Phòng",
    districts: ["Hồng Bàng", "Ngô Quyền", "Lê Chân", "Kiến An", "Hải An", "Đồ Sơn", "Dương Kinh"],
  },
  {
    name: "Cần Thơ",
    districts: ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn", "Thốt Nốt"],
  },
];

/**
 * Khoảng giá gói tập dùng chung cho bộ lọc (trang Phòng gym và trang Gói tập).
 *
 * Bug S2-19: quy ước NỬA MỞ [min, max) — `max` là giá đầu tiên KHÔNG thuộc khoảng.
 * Trước đây FE lọc `price < max` còn BE lọc `price <= maxPrice`, nên gói đúng
 * 1.000.000 đ rơi vào cả "Dưới 1 triệu" lẫn "1 – 3 triệu" tuỳ trang đang xem.
 * Ai dùng `max` để gọi API phải trừ 1 (xem `maxPriceParam`).
 */
export const PRICE_RANGES = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "under1m", label: "Dưới 1 triệu", min: 0, max: 1_000_000 },
  { value: "m1to3", label: "1 – 3 triệu", min: 1_000_000, max: 3_000_000 },
  { value: "m3to10", label: "3 – 10 triệu", min: 3_000_000, max: 10_000_000 },
  { value: "over10", label: "Trên 10 triệu", min: 10_000_000, max: undefined },
] as const;

export type PriceRangeValue = (typeof PRICE_RANGES)[number]["value"];

export type PriceRange = (typeof PRICE_RANGES)[number];

export function findPriceRange(value: string): PriceRange | undefined {
  return PRICE_RANGES.find((r) => r.value === value);
}

/** Cận dưới gửi lên API; undefined = không giới hạn. */
export function minPriceParam(range?: PriceRange) {
  return range && "min" in range ? range.min : undefined;
}

/**
 * Cận trên gửi lên API. BE so sánh `price <= maxPrice` nên phải trừ 1 để giữ đúng
 * nghĩa nửa mở — nếu không, gói đúng bằng `max` lọt vào cả hai khoảng liền kề.
 */
export function maxPriceParam(range?: PriceRange) {
  const max = range && "max" in range ? range.max : undefined;
  return max != null ? max - 1 : undefined;
}

/** Giá có nằm trong khoảng không — dùng cho các trang lọc phía client. */
export function priceInRange(price: number, range?: PriceRange) {
  if (!range || !("min" in range)) return true;
  if (price < range.min) return false;
  return range.max == null || price < range.max;
}
