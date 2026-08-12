/** Bán kính trung bình của Trái Đất (km) — hằng số của công thức haversine. */
const EARTH_RADIUS_KM = 6371;

export interface LatLng {
  lat: number;
  lng: number;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/**
 * Khoảng cách đường chim bay giữa hai điểm (km).
 *
 * Dùng để tính khoảng cách cho những địa điểm BE không tự chấm — ví dụ từng chi
 * nhánh của một gym, khi truy vấn tìm-quanh-đây chỉ trả về khoảng cách tới điểm
 * GẦN NHẤT của gym đó. Cùng công thức haversine với `GeoUtils` phía BE nên hai
 * bên không lệch nhau vài trăm mét trên cùng một cặp toạ độ.
 */
export function distanceKm(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Làm tròn như BE (2 chữ số) để nhãn "cách X km" hai bên đọc giống nhau. */
export function roundKm(km: number): number {
  return Math.round(km * 100) / 100;
}
