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

/** Khoảng giá gói tập dùng chung cho bộ lọc (đồng bộ với trang Gói tập). */
export const PRICE_RANGES = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "under1m", label: "Dưới 1 triệu", min: 0, max: 1_000_000 },
  { value: "m1to3", label: "1 – 3 triệu", min: 1_000_000, max: 3_000_000 },
  { value: "m3to10", label: "3 – 10 triệu", min: 3_000_000, max: 10_000_000 },
  { value: "over10", label: "Trên 10 triệu", min: 10_000_000, max: undefined },
] as const;

export type PriceRangeValue = (typeof PRICE_RANGES)[number]["value"];
