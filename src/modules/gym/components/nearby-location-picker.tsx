"use client";

import { useState } from "react";
import { Crosshair, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { marketplaceService } from "@/services/marketplace.service";
import {
  PlaceAutocompleteInput,
  type PickedPlace,
} from "@/shared/components/map/place-autocomplete-input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

/** Tâm tìm kiếm hiện tại. */
export interface SearchLocation {
  lat: number;
  lng: number;
  label: string;
}

/**
 * Các mức bán kính chọn được. Trần 50km khớp `app.google-maps.max-search-radius-km`
 * của BE — bày mức lớn hơn chỉ khiến người dùng tưởng đã mở rộng phạm vi trong khi
 * BE âm thầm kẹp lại.
 */
export const RADIUS_OPTIONS = [1, 2, 3, 5, 10, 20, 50] as const;

interface NearbyLocationPickerProps {
  location: SearchLocation | null;
  onLocationChange: (location: SearchLocation | null) => void;
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
  onError?: (message: string) => void;
}

/**
 * Chọn tâm tìm kiếm (UC-18): lấy vị trí thiết bị hoặc gõ một địa điểm bất kỳ,
 * kèm mức bán kính.
 */
export function NearbyLocationPicker({
  location,
  onLocationChange,
  radiusKm,
  onRadiusChange,
  onError,
}: NearbyLocationPickerProps) {
  const t = useTranslations();
  const [query, setQuery] = useState(location?.label ?? "");
  const [locating, setLocating] = useState(false);

  /**
   * Đổi toạ độ GPS thành địa chỉ đọc được, qua proxy của BE.
   *
   * V65: trước đây ưu tiên Geocoder phía trình duyệt của Google rồi mới lui về
   * proxy. Giờ chỉ còn một đường — FE không nạp SDK bản đồ nào nữa.
   *
   * Hỏng cũng không chặn luồng: toạ độ mới là thứ dùng để tìm kiếm, nhãn chỉ để
   * hiển thị cho người dùng biết mình đang tìm quanh đâu.
   */
  async function describe(lat: number, lng: number): Promise<string> {
    try {
      const result = await marketplaceService.reverseGeocode(lat, lng);
      if (result.formattedAddress) return result.formattedAddress;
    } catch {
      /* dùng nhãn mặc định */
    }
    return t("marketplace.nearby.myLocation");
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError?.(t("marketplace.nearby.geolocationUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const label = await describe(latitude, longitude);
        setQuery(label);
        onLocationChange({ lat: latitude, lng: longitude, label });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        onError?.(
          error.code === error.PERMISSION_DENIED
            ? t("marketplace.nearby.geolocationDenied")
            : t("marketplace.nearby.geolocationFailed"),
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function pickPlace(place: PickedPlace) {
    onLocationChange({ lat: place.lat, lng: place.lng, label: place.label });
  }

  function clear() {
    setQuery("");
    onLocationChange(null);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
          {t("marketplace.nearby.searchAround")}
        </p>
        <PlaceAutocompleteInput
          className="h-10"
          value={query}
          onValueChange={setQuery}
          onPlacePicked={pickPlace}
          onError={onError}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={useMyLocation}
          disabled={locating}
          className="h-10 flex-1 gap-2 text-xs font-semibold"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          {t("marketplace.nearby.useMyLocation")}
        </Button>
        {location && (
          <Button
            type="button"
            variant="outline"
            onClick={clear}
            className="h-10 gap-1.5 px-3 text-xs font-semibold"
          >
            <X className="size-3.5" />
            {t("marketplace.nearby.clearLocation")}
          </Button>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
          {t("marketplace.nearby.radius")}
        </p>
        <Select
          value={String(radiusKm)}
          onValueChange={(value) => onRadiusChange(Number(value))}
          disabled={!location}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((km) => (
              <SelectItem key={km} value={String(km)}>
                {t("marketplace.nearby.withinKm", { km })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!location && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {t("marketplace.nearby.pickLocationFirst")}
          </p>
        )}
      </div>
    </div>
  );
}
