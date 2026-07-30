"use client";

import { useEffect, useState } from "react";
import { env } from "@/core/config/env";

export type GoogleMapsStatus = "disabled" | "loading" | "ready" | "error";

/** Namespace `google.maps` sau khi script đã nạp xong. */
export type GoogleMaps = typeof google.maps;

const SCRIPT_ID = "google-maps-js-api";

/**
 * Promise dùng chung cho toàn ứng dụng. Nhiều component (bản đồ, ô địa điểm)
 * cùng cần API — không chia sẻ thì mỗi component nhét một thẻ <script> và Google
 * sẽ cảnh báo "You have included the Google Maps JavaScript API multiple times".
 */
let loaderPromise: Promise<GoogleMaps> | null = null;

function loadGoogleMaps(): Promise<GoogleMaps> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<GoogleMaps>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.google?.maps) resolve(window.google.maps);
      // Script tải xong nhưng không có window.google nghĩa là key bị từ chối
      // (referrer sai / API chưa bật) — Google trả 200 kèm trang lỗi.
      else reject(new Error("Google Maps API loaded without a maps namespace"));
    };
    const onError = () => reject(new Error("Failed to load the Google Maps script"));

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    if (!existing) {
      script.id = SCRIPT_ID;
      script.async = true;
      script.defer = true;
      // `loading=async` là cách Google khuyến nghị nạp bất đồng bộ; `places` cần
      // cho Autocomplete ở ô "tìm theo địa điểm tự chọn".
      script.src =
        "https://maps.googleapis.com/maps/api/js" +
        `?key=${encodeURIComponent(env.googleMapsApiKey)}` +
        "&libraries=places&language=vi&region=VN&loading=async";
      document.head.appendChild(script);
    }
  });

  // Lỗi phải xoá cache promise, nếu không lần thử lại nào cũng nhận lại đúng lỗi cũ.
  loaderPromise.catch(() => {
    loaderPromise = null;
  });
  return loaderPromise;
}

/**
 * Nạp Google Maps JavaScript API (UC-18).
 *
 * Không cấu hình `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` thì trả về trạng thái
 * `disabled` thay vì lỗi — trang tìm gym vẫn dùng được ở chế độ danh sách, phần
 * bản đồ chỉ đơn giản là không hiển thị.
 */
export function useGoogleMaps(): { status: GoogleMapsStatus; maps: GoogleMaps | null } {
  const enabled = Boolean(env.googleMapsApiKey);
  const [maps, setMaps] = useState<GoogleMaps | null>(null);
  const [status, setStatus] = useState<GoogleMapsStatus>(enabled ? "loading" : "disabled");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadGoogleMaps()
      .then((namespace) => {
        if (!active) return;
        setMaps(namespace);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { status, maps };
}
