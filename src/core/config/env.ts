export const env = {
  // `||` chứ không phải `??`: CI truyền biến chưa khai secret thành chuỗi RỖNG, mà
  // chuỗi rỗng thì `??` không cứu — phải coi rỗng như chưa cấu hình.
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  // UC-18 (V65): không còn khoá bản đồ nào ở FE. Bản đồ chạy Leaflet + tile
  // OpenStreetMap (không cần khoá), gợi ý địa chỉ đi qua proxy của BE (khoá nằm
  // ở server). NEXT_PUBLIC_GOOGLE_MAPS_API_KEY đã bị xoá — đừng thêm lại.
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
