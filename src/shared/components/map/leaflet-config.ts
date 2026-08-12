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
/**
 * Loại địa điểm được ghim. Chi nhánh mang màu khác trụ sở để nhìn bản đồ là biết
 * ngay đâu là cơ sở chính, đâu là chi nhánh — chỉ đọc popup thì phải bấm từng ghim.
 */
export type GymPinKind = "gym" | "branch";

/** Đỏ cho gym/trụ sở, lam cho chi nhánh — đủ tương phản với tile OSM. */
const PIN_COLOR: Record<GymPinKind, string> = {
  gym: "#dc2626",
  branch: "#1d4ed8",
};

export function gymPinIcon(L: Leaflet, kind: GymPinKind = "gym"): DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
             <path d="M13 0C5.82 0 0 5.82 0 13c0 9.06 11.42 20.02 11.9 20.48a1.58 1.58 0 0 0 2.2 0C14.58 33.02 26 22.06 26 13 26 5.82 20.18 0 13 0z" fill="${PIN_COLOR[kind]}"/>
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
 * Icon của một cụm ghim đã gom.
 *
 * Tự vẽ thay vì dùng `MarkerCluster.Default.css`: bộ mặc định là ba vòng tròn
 * xanh lá / vàng / xanh dương theo số lượng, lạc hẳn khỏi bảng màu của sản phẩm
 * và còn dễ bị hiểu nhầm là "trạng thái" (xanh = tốt, vàng = cảnh báo).
 *
 * Kích thước tăng theo số điểm để cụm lớn nổi hơn cụm nhỏ, nhưng chặn trần để
 * một cụm 200 điểm không che mất cả vùng bản đồ.
 */
export function clusterIcon(L: Leaflet, count: number): DivIcon {
  const size = count < 10 ? 34 : count < 100 ? 40 : 46;
  return L.divIcon({
    className: "",
    html: `<div style="
             width:${size}px;height:${size}px;border-radius:9999px;
             display:flex;align-items:center;justify-content:center;
             background:#00767f;color:#ffffff;
             border:3px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,.35);
             font-size:${count < 100 ? 13 : 12}px;font-weight:800;line-height:1;
           ">${count}</div>`,
    iconSize: [size, size],
    // Neo vào TÂM (khác ghim thường neo ở mũi nhọn dưới đáy): cụm là một chấm
    // tròn, neo đáy sẽ đẩy nó lệch lên trên khỏi vị trí thật của nhóm điểm.
    iconAnchor: [size / 2, size / 2],
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
