"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGoogleMaps } from "@/shared/hooks/use-google-maps";
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
 * Bản đồ xem trước + sửa ghim cho form địa chỉ của gym/chi nhánh (UC-18).
 *
 * Giải quyết đúng một vấn đề: Google hay đặt ghim ở giữa lô đất hoặc ở cổng sau,
 * và trước đây chủ gym không có cách nào biết điều đó — họ gõ địa chỉ, bấm lưu,
 * rồi khách tìm "gym quanh đây" bị dẫn sai chỗ. Nhìn thấy ghim là biết ngay, kéo
 * một cái là xong.
 *
 * Không dùng chung {@code GymMap}: bản đồ kia gắn chặt với tìm kiếm theo bán kính
 * (vòng tròn, nhiều ghim, InfoWindow, đồng bộ với danh sách kết quả). Nhét thêm
 * chế độ "một ghim kéo được" vào đó sẽ phải luồn hàng loạt prop không dùng tới
 * qua một component đang chạy tốt.
 */
export function AddressPinMap({ value, onChange, disabled, className }: AddressPinMapProps) {
  const t = useTranslations();
  const { status, maps } = useGoogleMaps();

  const containerRef = useRef<HTMLDivElement>(null);
  // State chứ không phải ref: effect vẽ ghim phải chạy lại NGAY sau khi bản đồ
  // vừa được tạo, mà gán vào ref thì không kích hoạt render nào cả.
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Listener của Google sống ngoài vòng đời React nên đọc handler qua ref, nếu
  // không nó gọi mãi bản bị bắt trong closure lúc khởi tạo.
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // ── Khởi tạo bản đồ một lần ──────────────────────────────────────────────
  useEffect(() => {
    if (status !== "ready" || !maps || !containerRef.current || mapRef.current) return;

    mapRef.current = new maps.Map(containerRef.current, {
      center: value ?? FALLBACK_CENTER,
      zoom: value ? 17 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    setMapReady(true);
    // `value` chỉ dùng làm tâm khởi tạo; effect bên dưới lo việc đồng bộ tiếp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, maps]);

  // ── Bấm lên bản đồ để đặt ghim ───────────────────────────────────────────
  // Tách khỏi effect khởi tạo: gộp chung thì ở StrictMode (dev) lần chạy thứ hai
  // thấy mapRef đã có nên return sớm, listener không bao giờ được gắn lại.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const listener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (disabledRef.current) return;
      const position = event.latLng;
      if (position) changeRef.current({ lat: position.lat(), lng: position.lng() });
    });
    return () => listener.remove();
  }, [mapReady]);

  // ── Ghim ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map) return;

    if (!value) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ map, position: value, draggable: !disabled });
      markerRef.current.addListener("dragend", (event: google.maps.MapMouseEvent) => {
        const position = event.latLng;
        if (position) changeRef.current({ lat: position.lat(), lng: position.lng() });
      });
    } else {
      markerRef.current.setPosition(value);
      markerRef.current.setDraggable(!disabled);
    }
    // panTo chứ không setCenter: chọn một gợi ý Places ở gần thì bản đồ trượt
    // mượt sang thay vì nhảy giật.
    map.panTo(value);
  }, [maps, mapReady, value, disabled]);

  // ── Dọn dẹp khi unmount ──────────────────────────────────────────────────
  // Gỡ khỏi bản đồ PHẢI đi kèm xoá ref: ở StrictMode cleanup chạy giữa hai lần
  // mount, effect sau đó thấy ref khác null nên chỉ setPosition mà không gắn lại
  // vào bản đồ -> ghim biến mất khi chạy dev.
  useEffect(() => {
    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, []);

  if (status !== "ready") {
    // Không có Maps key thì im lặng biến mất: form địa chỉ vẫn dùng được đầy đủ,
    // BE tự geocode khi lưu. Hiện một ô lỗi ở đây chỉ làm operator hoang mang về
    // một tính năng phụ trợ.
    if (status === "disabled") return null;
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
