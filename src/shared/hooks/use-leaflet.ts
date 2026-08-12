"use client";

import { useEffect, useState } from "react";
import type * as LeafletNamespace from "leaflet";

export type LeafletStatus = "loading" | "ready" | "error";

/** Namespace `L` sau khi module đã nạp xong. */
export type Leaflet = typeof LeafletNamespace;

/**
 * Promise dùng chung cho toàn ứng dụng. Nhiều component (bản đồ kết quả, bản đồ
 * ghim địa chỉ) cùng cần Leaflet — không chia sẻ thì mỗi component giữ một
 * promise riêng và webpack phải chờ cùng một chunk nhiều lần.
 */
let loaderPromise: Promise<Leaflet> | null = null;

function loadLeaflet(): Promise<Leaflet> {
  if (loaderPromise) return loaderPromise;

  // import() động chứ KHÔNG phải import tĩnh ở đầu file: Leaflet đụng `window`
  // ngay lúc module được đánh giá, mà component "use client" của App Router vẫn
  // được render trước ở phía server. Import tĩnh sẽ làm hỏng SSR chứ không phải
  // chỉ hỏng hydrate.
  loaderPromise = import("leaflet").then(
    // Leaflet 1.9 chỉ phát hành bản UMD (package.json không có "module"), nên
    // interop của webpack đặt namespace L ở `default`. Giữ nhánh `?? mod` phòng
    // trường hợp bundler khác trải phẳng named export.
    (mod) => (mod.default ?? mod) as Leaflet,
  );

  // Lỗi phải xoá cache promise, nếu không mọi lần thử lại đều nhận lại đúng lỗi cũ.
  loaderPromise.catch(() => {
    loaderPromise = null;
  });
  return loaderPromise;
}

/**
 * Nạp Leaflet phía trình duyệt (UC-18).
 *
 * <p>Thay cho {@code useGoogleMaps}: Leaflet + tile OpenStreetMap không cần API
 * key, nên không còn trạng thái "disabled" — bản đồ luôn khả dụng trừ khi chunk
 * tải hỏng. Trạng thái `loading` vẫn cần vì import động chỉ chạy sau khi
 * component đã mount.
 */
export function useLeaflet(): { status: LeafletStatus; L: Leaflet | null } {
  const [L, setL] = useState<Leaflet | null>(null);
  const [status, setStatus] = useState<LeafletStatus>("loading");

  useEffect(() => {
    let active = true;
    loadLeaflet()
      .then((namespace) => {
        if (!active) return;
        setL(namespace);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return { status, L };
}
