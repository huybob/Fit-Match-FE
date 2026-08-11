"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { marketplaceService } from "@/services/marketplace.service";
import { useGoogleMaps } from "@/shared/hooks/use-google-maps";
import { canonicalCityName, canonicalDistrictName } from "@/shared/constants/vn-locations";
import { Input } from "@/shared/components/ui/input";
import { IconButton } from "@/shared/components/ui/icon-button";
import { cn } from "@/shared/utils/cn.util";

/** Một địa điểm đã chọn: toạ độ + nhãn hiển thị lại cho người dùng. */
export interface PickedPlace {
  lat: number;
  lng: number;
  /**
   * Nhãn NGẮN để hiển thị lại trong ô nhập — tên địa điểm nếu Google có, không
   * thì rơi về địa chỉ đầy đủ. Dùng cho ô "tìm quanh đây", KHÔNG dùng để lưu.
   */
  label: string;
  /**
   * Địa chỉ đầy đủ đã chuẩn hoá của Google — đây mới là thứ được LƯU vào cột
   * address. Trước đây form lưu `label`, nghĩa là chọn "California Fitness" sẽ
   * ghi đúng chữ đó vào địa chỉ và BE geocode lại một cái tên thay vì một địa chỉ.
   */
  formattedAddress: string;
  /** Định danh ổn định của Google — dùng để đối chiếu/khử trùng địa chỉ về sau. */
  placeId?: string;
  /** Tách sẵn từ address_components để form khỏi bắt operator gõ lại. */
  district?: string;
  city?: string;
}

/**
 * Địa điểm operator đã ghim, ở dạng form giữ trong state và gửi lên khi lưu.
 *
 * Metadata đi kèm toạ độ chứ không tách rời: BE dùng nó thay cho một lượt geocode
 * chỉ để lấy lại đúng hai giá trị FE đang cầm sẵn. Prefill từ bản ghi cũ chỉ có
 * lat/lng — BE giữ nguyên metadata đang lưu khi không nhận được giá trị mới.
 */
export interface PinnedPlace {
  lat: number;
  lng: number;
  placeId?: string;
  formattedAddress?: string;
  /**
   * Toạ độ này do người kéo ghim trên bản đồ, không phải lấy nguyên từ gợi ý
   * Places. BE dùng cờ này để job làm mới định kỳ KHÔNG kéo ghim về chỗ Google
   * nói — nếu không, công sửa tay bị xoá sau 180 ngày mà không ai hiểu vì sao.
   */
  pinnedByUser?: boolean;
}

/**
 * Bóc quận/huyện + tỉnh/thành từ `address_components`.
 *
 * Ở Việt Nam Google trả quận/huyện ở `administrative_area_level_2` và tỉnh/thành
 * trực thuộc trung ương ở `administrative_area_level_1`. Một số phường/xã lại chỉ
 * có `sublocality_level_1`, nên lấy nó làm phương án dự phòng cho quận.
 *
 * Kết quả được chuẩn hoá về đúng chuỗi trong danh mục VN_CITIES khi khớp: bộ lọc
 * marketplace gửi lên chuỗi của danh mục, lưu tên dạng khác là gym rớt khỏi bộ lọc.
 */
function splitAdminAreas(components: google.maps.GeocoderAddressComponent[] | undefined) {
  const find = (type: string) => components?.find((c) => c.types.includes(type))?.long_name;
  const district = find("administrative_area_level_2") ?? find("sublocality_level_1");
  const city = find("administrative_area_level_1");
  return {
    district: canonicalDistrictName(district) ?? district,
    city: canonicalCityName(city) ?? city,
  };
}

interface PlaceAutocompleteInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onPlacePicked: (place: PickedPlace) => void;
  /** Báo lỗi ra ngoài (toast) — component không tự quyết định cách hiển thị. */
  onError?: (message: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Ô "tìm theo địa điểm tự chọn" (UC-18).
 *
 * Có key Maps JavaScript -> gợi ý Places Autocomplete ngay khi gõ (giới hạn
 * trong Việt Nam). Không có key -> vẫn dùng được: nhấn Enter sẽ gọi proxy
 * geocode của BE. Người dùng không bao giờ gặp một ô nhập chết.
 */
export function PlaceAutocompleteInput({
  value,
  onValueChange,
  onPlacePicked,
  onError,
  placeholder,
  className,
  disabled,
}: PlaceAutocompleteInputProps) {
  const t = useTranslations();
  const { status, maps } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const [resolving, setResolving] = useState(false);

  // Autocomplete gọi callback từ bên ngoài React nên phải đọc bản mới nhất qua
  // ref — bắt vào closure sẽ gọi phiên bản của lần render đầu tiên. Áp dụng cho
  // MỌI callback đi vào listener, không riêng onPlacePicked: chỉ cần một prop
  // đổi theo state của trang là bản cũ sẽ ghi đè bằng dữ liệu đã lỗi thời.
  const pickedRef = useRef(onPlacePicked);
  pickedRef.current = onPlacePicked;
  const valueChangeRef = useRef(onValueChange);
  valueChangeRef.current = onValueChange;
  const errorRef = useRef(onError);
  errorRef.current = onError;

  useEffect(() => {
    if (status !== "ready" || !maps || !inputRef.current) return;

    const autocomplete = new maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "vn" },
      // address_components + place_id vẫn thuộc nhóm Basic Data như các field cũ
      // nên không đẩy Place Details lên bậc giá cao hơn.
      fields: ["geometry.location", "formatted_address", "name", "address_components", "place_id"],
      types: ["geocode", "establishment"],
    });
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (!location) {
        // Người dùng nhấn Enter trên chuỗi tự gõ thay vì chọn một gợi ý —
        // Google trả về place không có geometry.
        errorRef.current?.(t("marketplace.nearby.placeNotFound"));
        return;
      }
      const formattedAddress = place.formatted_address ?? place.name ?? "";
      const label = place.name ?? formattedAddress;
      const { district, city } = splitAdminAreas(place.address_components);
      valueChangeRef.current(label);
      pickedRef.current({
        lat: location.lat(),
        lng: location.lng(),
        label,
        formattedAddress,
        placeId: place.place_id,
        district,
        city,
      });
    });

    return () => {
      listener.remove();
      maps.event.clearInstanceListeners(autocomplete);
    };
    // Mọi callback đọc qua ref nên chỉ cần gắn lại khi API sẵn sàng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, maps]);

  /** Đường lui khi không có key browser: nhờ BE geocode chuỗi vừa gõ. */
  async function geocodeViaBackend() {
    const query = value.trim();
    if (!query || resolving) return;
    setResolving(true);
    try {
      const result = await marketplaceService.geocodeAddress(query);
      if (result.latitude == null || result.longitude == null) {
        onError?.(t("marketplace.nearby.placeNotFound"));
        return;
      }
      const label = result.formattedAddress ?? query;
      onValueChange(label);
      // Proxy BE không trả address_components nên district/city để trống — form
      // giữ nguyên giá trị operator đã gõ thay vì bị xoá trắng.
      onPlacePicked({
        lat: result.latitude,
        lng: result.longitude,
        label,
        formattedAddress: label,
        placeId: result.placeId,
      });
    } catch {
      onError?.(t("marketplace.nearby.placeLookupFailed"));
    } finally {
      setResolving(false);
    }
  }

  const usesBackendFallback = status !== "ready";

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? t("marketplace.nearby.placePlaceholder")}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // Enter trong ô này không bao giờ được submit form bộ lọc: khi có
          // Autocomplete, Enter là để chọn gợi ý đang sáng.
          event.preventDefault();
          if (usesBackendFallback) void geocodeViaBackend();
        }}
        className={cn("pl-10", usesBackendFallback && "pr-11", className)}
      />
      {usesBackendFallback && (
        <IconButton
          type="button"
          tooltip={t("marketplace.nearby.lookupPlace")}
          disabled={disabled || resolving || !value.trim()}
          onClick={() => void geocodeViaBackend()}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {resolving ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </IconButton>
      )}
    </div>
  );
}
