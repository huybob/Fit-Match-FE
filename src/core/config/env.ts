export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  /**
   * UC-18: key Maps JavaScript API dùng ở TRÌNH DUYỆT (bản đồ + Places
   * Autocomplete). Key này lộ ra trong bundle theo thiết kế của Google — bắt buộc
   * giới hạn theo HTTP referrer trong Google Cloud Console, và là key KHÁC với
   * server key mà BE dùng cho Geocoding API.
   *
   * Rỗng = tính năng bản đồ tự tắt: trang tìm gym vẫn chạy ở chế độ danh sách,
   * ô địa điểm chuyển sang gọi proxy geocode của BE.
   */
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
};
