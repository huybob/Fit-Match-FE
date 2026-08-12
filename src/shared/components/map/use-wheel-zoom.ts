"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

/**
 * Số pixel cuộn cho mỗi mức zoom — lấy đúng `wheelPxPerZoomLevel` mặc định của
 * Leaflet. Không cộng dồn thế này thì trackpad (bắn hàng chục sự kiện nhỏ mỗi
 * lần vuốt) sẽ nhảy vọt qua 5-6 mức zoom chỉ trong một cú vuốt.
 */
const PX_PER_ZOOM = 60;

/** Ngưng cuộn lâu hơn mức này thì bắt đầu đếm lại từ đầu. */
const RESET_AFTER_MS = 250;

/** Thời gian giữ nhắc "giữ Ctrl để phóng to" sau lần cuộn trần. */
const HINT_MS = 1800;

/**
 * Cuộn chuột để phóng to/thu nhỏ bản đồ, theo lối Google Maps nhúng: **Ctrl (hoặc
 * ⌘) + cuộn** thì zoom, cuộn trần thì trang vẫn cuộn như thường.
 *
 * Vì sao không bật thẳng `scrollWheelZoom` của Leaflet: bản đồ nằm giữa một trang
 * dài: con trỏ vô tình đi ngang qua nó khi đang cuộn đọc kết quả sẽ khiến trang
 * đứng khựng lại và bản đồ nhảy zoom — người dùng mất chỗ đang đọc mà không hiểu
 * vì sao. Đổi lại, lần đầu cuộn trần sẽ hiện một dòng nhắc cách phóng to.
 *
 * Trên macOS, cử chỉ chụm hai ngón của trackpad được trình duyệt gửi xuống dưới
 * dạng wheel kèm `ctrlKey` — nên chụm để zoom cũng chạy sẵn, không cần xử lý riêng.
 *
 * @returns có đang hiện dòng nhắc hay không.
 */
export function useWheelZoom(mapRef: React.RefObject<LeafletMap | null>, ready: boolean) {
  const [hintVisible, setHintVisible] = useState(false);
  const accumulatedRef = useRef(0);
  const lastWheelAtRef = useRef(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const container = map.getContainer();
    let hintTimer: ReturnType<typeof setTimeout> | undefined;

    function onWheel(event: WheelEvent) {
      const map = mapRef.current;
      if (!map) return;

      if (!event.ctrlKey && !event.metaKey) {
        // Không chặn sự kiện: trang phải cuộn bình thường. Chỉ nhắc một dòng.
        setHintVisible(true);
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => setHintVisible(false), HINT_MS);
        return;
      }

      // Ctrl + cuộn mặc định là phóng to CẢ TRANG của trình duyệt — phải chặn,
      // nếu không giao diện phình ra thay vì bản đồ phóng to.
      event.preventDefault();
      setHintVisible(false);
      clearTimeout(hintTimer);

      const now = Date.now();
      if (now - lastWheelAtRef.current > RESET_AFTER_MS) accumulatedRef.current = 0;
      lastWheelAtRef.current = now;

      accumulatedRef.current += event.deltaY;
      const steps = Math.trunc(accumulatedRef.current / PX_PER_ZOOM);
      if (steps === 0) return;
      accumulatedRef.current -= steps * PX_PER_ZOOM;

      // Zoom quanh ĐIỂM DƯỚI CON TRỎ chứ không quanh tâm bản đồ: người dùng chỉ
      // vào chỗ muốn xem rồi cuộn, chỗ đó phải đứng yên dưới con trỏ.
      const at = map.containerPointToLatLng(map.mouseEventToContainerPoint(event));
      // deltaY dương = cuộn xuống = thu nhỏ. setZoomAround tự kẹp trong min/max zoom.
      map.setZoomAround(at, map.getZoom() - steps);
    }

    // passive: false — trình duyệt chỉ cho preventDefault khi listener không passive.
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      clearTimeout(hintTimer);
    };
  }, [mapRef, ready]);

  return hintVisible;
}
