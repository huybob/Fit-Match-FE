"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Map as LeafletMap, Marker } from "leaflet";
import { useLeaflet } from "@/shared/hooks/use-leaflet";
import { addBaseTiles, gymPinIcon } from "@/shared/components/map/leaflet-config";
import { cn } from "@/shared/utils/cn.util";

interface AddressPinMapProps {
  /** Toạ độ đang gắn với địa chỉ; null = chưa xác định được. */
  value: { lat: number; lng: number } | null;
  /** Người dùng kéo ghim hoặc bấm lên bản đồ để sửa vị trí. */
  onChange: (position: { lat: number; lng: number }) => void;
  disabled?: boolean;
  className?: string;
}

/** Hà Nội — chỉ để bản đồ có chỗ đứng khi chưa có toạ độ nào. */
const FALLBACK_CENTER = { lat: 21.0278, lng: 105.8342 };

/**
 * Bản đồ xem trước + sửa ghim cho form địa chỉ của gym/chi nhánh (UC-18) —
 * Leaflet + tile OpenStreetMap.
 *
 * Giải quyết đúng một vấn đề: dịch vụ geocoding hay đặt ghim ở giữa lô đất hoặc
 * ở cổng sau, và trước đây chủ gym không có cách nào biết điều đó — họ gõ địa
 * chỉ, bấm lưu, rồi khách tìm "gym quanh đây" bị dẫn sai chỗ. Nhìn thấy ghim là
 * biết ngay, kéo một cái là xong.
 *
 * Vai trò này còn quan trọng hơn kể từ khi geocoding chuyển sang nguồn dữ liệu
 * OpenStreetMap: độ phủ số nhà ở Việt Nam mỏng hơn, nên ghim tay là đường lui
 * chính thức chứ không còn là tiện ích phụ.
 *
 * Không dùng chung {@code GymMap}: bản đồ kia gắn chặt với tìm kiếm theo bán kính
 * (vòng tròn, nhiều ghim, popup, đồng bộ với danh sách kết quả). Nhét thêm chế độ
 * "một ghim kéo được" vào đó sẽ phải luồn hàng loạt prop không dùng tới qua một
 * component đang chạy tốt.
 */
export function AddressPinMap({ value, onChange, disabled, className }: AddressPinMapProps) {
  const t = useTranslations();
  const { status, L } = useLeaflet();

  const containerRef = useRef<HTMLDivElement>(null);
  // State chứ không phải ref: effect vẽ ghim phải chạy lại NGAY sau khi bản đồ
  // vừa được tạo, mà gán vào ref thì không kích hoạt render nào cả.
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  // Listener của Leaflet sống ngoài vòng đời React nên đọc handler qua ref, nếu
  // không nó gọi mãi bản bị bắt trong closure lúc khởi tạo.
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // ── Khởi tạo bản đồ ──────────────────────────────────────────────────────
  // Listener bấm-bản-đồ nằm ngay trong effect này: `map.remove()` ở cleanup huỷ
  // sạch bản đồ nên mỗi lần mount đều dựng mới hoàn toàn, không có cảnh listener
  // trỏ vào một bản đồ đã chết như thời Google Maps (API đó không có hàm huỷ).
  useEffect(() => {
    if (status !== "ready" || !L || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [value?.lat ?? FALLBACK_CENTER.lat, value?.lng ?? FALLBACK_CENTER.lng],
      zoom: value ? 17 : 12,
      scrollWheelZoom: false,
    });
    addBaseTiles(L, map);
    map.on("click", (event) => {
      if (disabledRef.current) return;
      changeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;
    setMapReady(true);

    return () => {
      // Huỷ hẳn: `map.remove()` xoá cả `_leaflet_id` trên container, nếu không lần
      // mount sau Leaflet ném "Map container is already initialized".
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
    // `value` chỉ dùng làm tâm khởi tạo; effect bên dưới lo việc đồng bộ tiếp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, L]);

  // ── Ghim ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const position: [number, number] = [value.lat, value.lng];

    if (!markerRef.current) {
      const marker = L.marker(position, { icon: gymPinIcon(L), draggable: !disabled }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        changeRef.current({ lat, lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(position);
      // Leaflet bật/tắt kéo qua handler `dragging` chứ không có setter như Google.
      // Handler chỉ tồn tại khi marker được tạo với `draggable: true`, nên phải
      // hỏi optional — form ở chế độ chỉ đọc từ đầu thì nó là undefined.
      if (disabled) markerRef.current.dragging?.disable();
      else markerRef.current.dragging?.enable();
    }
    // panTo chứ không setView: chọn một gợi ý địa chỉ ở gần thì bản đồ trượt
    // mượt sang thay vì nhảy giật.
    map.panTo(position);
  }, [L, mapReady, value, disabled]);

  if (status !== "ready") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("marketplace.nearby.mapLoading")}
          </>
        ) : (
          <>
            <MapPinOff className="size-4" />
            {t("marketplace.nearby.mapError")}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div ref={containerRef} className="h-48 rounded-xl border border-border" />
      <p className="text-[11px] text-muted-foreground">
        {disabled
          ? t("gym.branches.pinMapReadOnly")
          : value
            ? t("gym.branches.pinMapDragHint")
            : t("gym.branches.pinMapEmptyHint")}
      </p>
    </div>
  );
}
