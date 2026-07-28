/**
 * Kiểu của Google Maps JavaScript API do gói `@types/google.maps` cung cấp
 * (namespace `google.maps` toàn cục).
 *
 * Gói đó KHÔNG khai báo `window.google`, trong khi script được nạp động lúc
 * runtime nên phải kiểm tra sự tồn tại của nó trước khi dùng — khai báo ở đây để
 * việc kiểm tra không cần ép kiểu.
 */
declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};
