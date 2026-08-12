"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Circle, CircleMarker, Map as LeafletMap, Marker } from "leaflet";
import { useLeaflet } from "@/shared/hooks/use-leaflet";
import { addBaseTiles, gymPinIcon } from "@/shared/components/map/leaflet-config";
import { cn } from "@/shared/utils/cn.util";

/** Một ghim gym trên bản đồ. */
export interface GymMapMarker {
  id: number;
  title: string;
  lat: number;
  lng: number;
  /** Dòng phụ trong popup: địa chỉ hoặc "Chi nhánh X". */
  subtitle?: string;
  distanceLabel?: string;
}

interface GymMapProps {
  /** Tâm tìm kiếm (vị trí người dùng / địa điểm tự chọn); null = chưa chọn. */
  center: { lat: number; lng: number } | null;
  radiusKm?: number;
  markers: GymMapMarker[];
  /** Gym đang được trỏ tới ở danh sách — ghim tương ứng mở popup. */
  activeId?: number | null;
  onMarkerClick?: (id: number) => void;
  /** Cho phép người dùng đổi tâm bằng cách bấm thẳng lên bản đồ. */
  onCenterPick?: (position: { lat: number; lng: number }) => void;
  className?: string;
}

/** Hà Nội — tâm mặc định khi người dùng chưa chọn vị trí nào. */
const FALLBACK_CENTER = { lat: 21.0278, lng: 105.8342 };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(item: GymMapMarker) {
  return `<div style="min-width:160px">
            <strong>${escapeHtml(item.title)}</strong>
            ${item.subtitle ? `<div style="font-size:12px;opacity:.75">${escapeHtml(item.subtitle)}</div>` : ""}
            ${item.distanceLabel ? `<div style="font-size:12px;font-weight:600">${escapeHtml(item.distanceLabel)}</div>` : ""}
          </div>`;
}

/**
 * Bản đồ kết quả tìm gym theo bán kính (UC-18) — Leaflet + tile OpenStreetMap.
 *
 * Bản đồ là lớp bổ trợ: chunk Leaflet tải hỏng thì component chỉ hiện một ô
 * thông báo, danh sách kết quả bên cạnh vẫn hoạt động đầy đủ.
 */
export function GymMap({
  center,
  radiusKm,
  markers,
  activeId,
  onMarkerClick,
  onCenterPick,
  className,
}: GymMapProps) {
  const t = useTranslations();
  const { status, L } = useLeaflet();

  const containerRef = useRef<HTMLDivElement>(null);
  // State (không phải ref) vì các effect vẽ ghim/vòng tròn phải chạy lại NGAY khi
  // bản đồ vừa được tạo — gán vào ref không kích hoạt render nào cả.
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const centerMarkerRef = useRef<CircleMarker | null>(null);
  const gymMarkersRef = useRef(new Map<number, Marker>());

  // Handler đi vào listener của Leaflet (ngoài vòng đời React) nên đọc qua ref để
  // luôn gọi bản mới nhất thay vì bản bị bắt trong closure lúc khởi tạo.
  const markerClickRef = useRef(onMarkerClick);
  markerClickRef.current = onMarkerClick;
  const centerPickRef = useRef(onCenterPick);
  centerPickRef.current = onCenterPick;

  // ── Khởi tạo bản đồ ──────────────────────────────────────────────────────
  // Listener bấm-bản-đồ gắn ngay trong effect này chứ không tách riêng: khác với
  // Google Maps (không có API huỷ, nên bản đồ buộc phải sống sót qua cleanup),
  // Leaflet có `map.remove()` huỷ sạch. Cleanup huỷ hẳn rồi mount lại dựng mới,
  // nên listener luôn nằm trên một bản đồ còn sống — kể cả ở StrictMode.
  useEffect(() => {
    if (status !== "ready" || !L || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center?.lat ?? FALLBACK_CENTER.lat, center?.lng ?? FALLBACK_CENTER.lng],
      zoom: 13,
      // Cuộn trang bằng bánh xe khi con trỏ vô tình đi qua bản đồ là hành vi khó
      // chịu nhất của bản đồ nhúng; Google mặc định cũng đòi Ctrl để zoom.
      scrollWheelZoom: false,
    });
    addBaseTiles(L, map);
    map.on("click", (event) => {
      centerPickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;
    setMapReady(true);

    const gymMarkers = gymMarkersRef.current;
    return () => {
      // `map.remove()` gỡ mọi layer, listener và cả thuộc tính `_leaflet_id` trên
      // container. Bỏ bước này thì lần mount sau Leaflet ném "Map container is
      // already initialized" — đúng kịch bản StrictMode chạy effect hai lần.
      map.remove();
      mapRef.current = null;
      // Layer đã chết theo bản đồ, nhưng ref thì chưa — không xoá thì effect sau
      // tưởng ghim còn sống và chỉ gọi setLatLng trên object mồ côi.
      gymMarkers.clear();
      circleRef.current = null;
      centerMarkerRef.current = null;
      setMapReady(false);
    };
    // `center` ban đầu chỉ dùng làm tâm khởi tạo; effect bên dưới lo đồng bộ tiếp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, L]);

  // ── Tâm + vòng tròn bán kính ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;

    if (!center) {
      centerMarkerRef.current?.remove();
      centerMarkerRef.current = null;
      circleRef.current?.remove();
      circleRef.current = null;
      return;
    }

    const position: [number, number] = [center.lat, center.lng];

    if (!centerMarkerRef.current) {
      // circleMarker (bán kính tính bằng PIXEL) chứ không phải circle (bán kính
      // tính bằng mét): đây là chấm đánh dấu vị trí, nó phải giữ nguyên kích thước
      // khi người dùng zoom.
      centerMarkerRef.current = L.circleMarker(position, {
        radius: 8,
        fillColor: "#2563eb",
        fillOpacity: 1,
        color: "#ffffff",
        weight: 3,
        interactive: false,
      }).addTo(map);
    } else {
      centerMarkerRef.current.setLatLng(position);
    }

    const radiusMeters = (radiusKm ?? 0) * 1000;
    if (radiusMeters > 0) {
      if (!circleRef.current) {
        circleRef.current = L.circle(position, {
          radius: radiusMeters,
          color: "#2563eb",
          opacity: 0.5,
          weight: 1,
          fillColor: "#2563eb",
          fillOpacity: 0.07,
          interactive: false,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng(position);
        circleRef.current.setRadius(radiusMeters);
      }
      // Khớp khung nhìn với vòng tròn để người dùng thấy đúng phạm vi đang lọc.
      map.fitBounds(circleRef.current.getBounds());
    } else {
      circleRef.current?.remove();
      circleRef.current = null;
      map.panTo(position);
    }
    // `mapReady` trong deps: hiệu ứng phải chạy lại ngay sau khi bản đồ được tạo
    // và sau mỗi lần cleanup xoá ref, không phụ thuộc thứ tự effect.
  }, [L, mapReady, center, radiusKm]);

  // ── Ghim các gym ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;

    const live = gymMarkersRef.current;
    const nextIds = new Set(markers.map((m) => m.id));

    // Gỡ ghim của gym không còn trong kết quả — quên bước này thì mỗi lần đổi
    // bộ lọc bản đồ lại chồng thêm một lớp ghim cũ.
    for (const [id, marker] of live) {
      if (!nextIds.has(id)) {
        marker.remove();
        live.delete(id);
      }
    }

    for (const item of markers) {
      const position: [number, number] = [item.lat, item.lng];
      const existing = live.get(item.id);
      if (existing) {
        existing.setLatLng(position);
        // Nội dung phải cập nhật theo: cùng một gym có thể đổi khoảng cách khi
        // người dùng dời tâm tìm kiếm mà id thì không đổi.
        existing.setPopupContent(popupHtml(item));
        continue;
      }
      const marker = L.marker(position, { icon: gymPinIcon(L), title: item.title })
        .bindPopup(popupHtml(item))
        .addTo(map);
      marker.on("click", () => markerClickRef.current?.(item.id));
      live.set(item.id, marker);
    }
  }, [L, mapReady, markers]);

  // ── Đồng bộ popup với gym đang chọn ở danh sách ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const marker = activeId == null ? null : gymMarkersRef.current.get(activeId);
    if (!marker) {
      map.closePopup();
      return;
    }
    marker.openPopup();
  }, [mapReady, activeId, markers]);

  if (status !== "ready") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/30 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            {t("marketplace.nearby.mapLoading")}
          </>
        ) : (
          <>
            <MapPinOff className="size-5" />
            <p className="max-w-xs px-4">{t("marketplace.nearby.mapError")}</p>
          </>
        )}
      </div>
    );
  }

  return <div ref={containerRef} className={cn("rounded-2xl border border-border", className)} />;
}
