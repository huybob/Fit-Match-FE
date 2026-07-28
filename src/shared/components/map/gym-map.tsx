"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGoogleMaps } from "@/shared/hooks/use-google-maps";
import { cn } from "@/shared/utils/cn.util";

/** Một ghim gym trên bản đồ. */
export interface GymMapMarker {
  id: number;
  title: string;
  lat: number;
  lng: number;
  /** Dòng phụ trong InfoWindow: địa chỉ hoặc "Chi nhánh X". */
  subtitle?: string;
  distanceLabel?: string;
}

interface GymMapProps {
  /** Tâm tìm kiếm (vị trí người dùng / địa điểm tự chọn); null = chưa chọn. */
  center: { lat: number; lng: number } | null;
  radiusKm?: number;
  markers: GymMapMarker[];
  /** Gym đang được trỏ tới ở danh sách — ghim tương ứng mở InfoWindow. */
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

/**
 * Bản đồ kết quả tìm gym theo bán kính (UC-18).
 *
 * Bản đồ là lớp bổ trợ: thiếu key hoặc script lỗi thì component chỉ hiện một ô
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
  const { status, maps } = useGoogleMaps();

  const containerRef = useRef<HTMLDivElement>(null);
  // State (không phải ref) vì các effect vẽ ghim/vòng tròn phải chạy lại NGAY khi
  // bản đồ vừa được tạo — gán vào ref không kích hoạt render nào cả.
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const gymMarkersRef = useRef(new Map<number, google.maps.Marker>());

  // Handler đi vào listener của Google (ngoài vòng đời React) nên đọc qua ref để
  // luôn gọi bản mới nhất thay vì bản bị bắt trong closure lúc khởi tạo.
  const markerClickRef = useRef(onMarkerClick);
  markerClickRef.current = onMarkerClick;
  const centerPickRef = useRef(onCenterPick);
  centerPickRef.current = onCenterPick;

  // ── Khởi tạo bản đồ một lần ──────────────────────────────────────────────
  // Việc tạo bản đồ và việc gắn listener PHẢI tách làm hai effect. Gộp chung thì
  // ở StrictMode (dev) effect chạy 2 lần: lần 1 tạo bản đồ rồi cleanup gỡ
  // listener, lần 2 thấy mapRef đã có nên return sớm -> listener không bao giờ
  // được gắn lại và tính năng bấm bản đồ chết im lặng khi chạy dev.
  useEffect(() => {
    if (status !== "ready" || !maps || !containerRef.current || mapRef.current) return;

    mapRef.current = new maps.Map(containerRef.current, {
      center: center ?? FALLBACK_CENTER,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    infoWindowRef.current = new maps.InfoWindow();
    setMapReady(true);
    // Chỉ tạo bản đồ khi API sẵn sàng; `center` ban đầu chỉ dùng làm tâm khởi tạo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, maps]);

  // ── Bấm lên bản đồ để đổi tâm ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const listener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
      const position = event.latLng;
      if (position && centerPickRef.current) {
        centerPickRef.current({ lat: position.lat(), lng: position.lng() });
      }
    });
    return () => listener.remove();
  }, [mapReady]);

  // ── Tâm + vòng tròn bán kính ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map) return;

    if (!center) {
      centerMarkerRef.current?.setMap(null);
      centerMarkerRef.current = null;
      circleRef.current?.setMap(null);
      circleRef.current = null;
      return;
    }

    if (!centerMarkerRef.current) {
      centerMarkerRef.current = new maps.Marker({
        map,
        position: center,
        zIndex: 999,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      centerMarkerRef.current.setPosition(center);
    }

    const radiusMeters = (radiusKm ?? 0) * 1000;
    if (radiusMeters > 0) {
      if (!circleRef.current) {
        circleRef.current = new maps.Circle({
          map,
          center,
          radius: radiusMeters,
          strokeColor: "#2563eb",
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: "#2563eb",
          fillOpacity: 0.07,
          clickable: false,
        });
      } else {
        circleRef.current.setCenter(center);
        circleRef.current.setRadius(radiusMeters);
      }
      // Khớp khung nhìn với vòng tròn để người dùng thấy đúng phạm vi đang lọc.
      const bounds = circleRef.current.getBounds();
      if (bounds) map.fitBounds(bounds);
    } else {
      circleRef.current?.setMap(null);
      circleRef.current = null;
      map.panTo(center);
    }
    // `mapReady` trong deps: hiệu ứng phải chạy lại ngay sau khi bản đồ được tạo
    // và sau mỗi lần cleanup xoá ref (StrictMode), không phụ thuộc thứ tự effect.
  }, [maps, mapReady, center, radiusKm]);

  // ── Ghim các gym ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map) return;

    const live = gymMarkersRef.current;
    const nextIds = new Set(markers.map((m) => m.id));

    // Gỡ ghim của gym không còn trong kết quả — quên bước này thì mỗi lần đổi
    // bộ lọc bản đồ lại chồng thêm một lớp ghim cũ.
    for (const [id, marker] of live) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        live.delete(id);
      }
    }

    for (const item of markers) {
      const position = { lat: item.lat, lng: item.lng };
      const existing = live.get(item.id);
      if (existing) {
        existing.setPosition(position);
        continue;
      }
      const marker = new maps.Marker({ map, position, title: item.title });
      marker.addListener("click", () => markerClickRef.current?.(item.id));
      live.set(item.id, marker);
    }
  }, [maps, mapReady, markers]);

  // ── Đồng bộ InfoWindow với gym đang chọn ở danh sách ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) return;

    const target = activeId == null ? null : markers.find((m) => m.id === activeId);
    const marker = activeId == null ? null : gymMarkersRef.current.get(activeId);
    if (!target || !marker) {
      infoWindow.close();
      return;
    }
    infoWindow.setContent(
      `<div style="min-width:160px">
         <strong>${escapeHtml(target.title)}</strong>
         ${target.subtitle ? `<div style="font-size:12px;opacity:.75">${escapeHtml(target.subtitle)}</div>` : ""}
         ${target.distanceLabel ? `<div style="font-size:12px;font-weight:600">${escapeHtml(target.distanceLabel)}</div>` : ""}
       </div>`,
    );
    infoWindow.open({ map, anchor: marker });
  }, [mapReady, activeId, markers]);

  // ── Dọn dẹp khi unmount ──────────────────────────────────────────────────
  // Gỡ khỏi bản đồ PHẢI đi kèm xoá ref: ở StrictMode (dev) cleanup này chạy giữa
  // hai lần mount, effect vẽ lại sau đó thấy ref còn khác null nên chỉ gọi
  // setCenter/setRadius mà không gắn lại vào bản đồ -> vòng tròn bán kính và ghim
  // vị trí người dùng biến mất khi chạy dev.
  //
  // Riêng bản đồ thì giữ lại (Google Maps không có API huỷ, và container không
  // bị remount) — effect khởi tạo tự bỏ qua nhờ mapRef đã có.
  useEffect(() => {
    const gymMarkers = gymMarkersRef.current;
    return () => {
      gymMarkers.forEach((marker) => marker.setMap(null));
      gymMarkers.clear();
      circleRef.current?.setMap(null);
      circleRef.current = null;
      centerMarkerRef.current?.setMap(null);
      centerMarkerRef.current = null;
      infoWindowRef.current?.close();
    };
  }, []);

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
            <p className="max-w-xs px-4">
              {status === "disabled"
                ? t("marketplace.nearby.mapDisabled")
                : t("marketplace.nearby.mapError")}
            </p>
          </>
        )}
      </div>
    );
  }

  return <div ref={containerRef} className={cn("rounded-2xl border border-border", className)} />;
}
