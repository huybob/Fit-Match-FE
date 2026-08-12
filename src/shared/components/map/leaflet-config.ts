import type { DivIcon } from "leaflet";
import type { Leaflet } from "@/shared/hooks/use-leaflet";

/**
 * Cấu hình tile + ghim dùng chung cho mọi bản đồ (UC-18).
 *
 * <p>Tách khỏi component vì cả bản đồ kết quả tìm kiếm lẫn bản đồ ghim địa chỉ
 * phải trông giống nhau và phải gắn CÙNG một dòng attribution — quên ở một chỗ
 * là vi phạm điều khoản của OpenStreetMap.
 */

/** Tile raster của OpenStreetMap. Không cần API key, không cần tài khoản. */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * Attribution BẮT BUỘC theo điều khoản OSM. Leaflet tự dựng control ở góc dưới
 * phải; đừng tắt nó đi.
 */
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** OSM chỉ dựng tile tới zoom 19; xin cao hơn sẽ nhận về ô xám. */
export const TILE_MAX_ZOOM = 19;

/**
 * Ghim một phòng gym.
 *
 * <p>Dùng {@code divIcon} với SVG nội tuyến thay vì icon ảnh mặc định của
 * Leaflet: icon mặc định trỏ tới `images/marker-icon.png` bằng đường dẫn tương
 * đối so với file CSS, và mọi bundler đều làm hỏng đường dẫn đó — kết quả là
 * ghim hiện ra dưới dạng ảnh vỡ. SVG nội tuyến thì không có asset nào để hỏng.
 *
 * <p>{@code className} rỗng là có chủ đích: mặc định Leaflet gắn
 * `leaflet-div-icon` (nền trắng + viền xám) và nó sẽ vẽ một ô vuông quanh ghim.
 */
export function gymPinIcon(L: Leaflet): DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
             <path d="M13 0C5.82 0 0 5.82 0 13c0 9.06 11.42 20.02 11.9 20.48a1.58 1.58 0 0 0 2.2 0C14.58 33.02 26 22.06 26 13 26 5.82 20.18 0 13 0z" fill="#dc2626"/>
             <circle cx="13" cy="12.6" r="4.6" fill="#ffffff"/>
           </svg>`,
    iconSize: [26, 34],
    // Mũi ghim nằm ở đáy SVG nên neo vào (13, 34), không phải tâm ảnh — neo sai
    // thì ghim lệch khỏi toạ độ thật đúng bằng nửa chiều cao icon.
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

/**
 * Gắn lớp tile vào một bản đồ vừa tạo. Gói lại thành hàm để không nơi nào quên
 * `maxZoom` hoặc `attribution`.
 */
export function addBaseTiles(L: Leaflet, map: import("leaflet").Map): void {
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: TILE_MAX_ZOOM,
  }).addTo(map);
}
