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
  /**
   * UC-003: OAuth Client ID (loại Web application) cho nút "Đăng nhập bằng
   * Google". Client ID lộ ra trong bundle theo thiết kế của Google — bảo mật nằm
   * ở danh sách "Authorized JavaScript origins" và ở việc BE kiểm tra lại claim
   * `aud` của ID token, nên phải TRÙNG với GOOGLE_OAUTH_CLIENT_IDS của BE.
   *
   * Rỗng = ẩn nút Google, chỉ còn đăng nhập bằng mật khẩu.
   */
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
};
