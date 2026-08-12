"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  marketplaceService,
  type PlaceProvider,
  type PlaceSuggestion,
} from "@/services/marketplace.service";
import { canonicalCityName, canonicalDistrictName } from "@/shared/constants/vn-locations";
import { Input } from "@/shared/components/ui/input";
import { IconButton } from "@/shared/components/ui/icon-button";
import { cn } from "@/shared/utils/cn.util";

/** Một địa điểm đã chọn: toạ độ + nhãn hiển thị lại cho người dùng. */
export interface PickedPlace {
  lat: number;
  lng: number;
  /**
   * Nhãn NGẮN để hiển thị lại trong ô nhập — tên địa điểm nếu có, không thì rơi
   * về địa chỉ đầy đủ. Dùng cho ô "tìm quanh đây", KHÔNG dùng để lưu.
   */
  label: string;
  /**
   * Địa chỉ đầy đủ đã chuẩn hoá — đây mới là thứ được LƯU vào cột address.
   * Trước đây form lưu `label`, nghĩa là chọn "California Fitness" sẽ ghi đúng
   * chữ đó vào địa chỉ và BE geocode lại một cái tên thay vì một địa chỉ.
   */
  formattedAddress: string;
  /** Định danh ổn định phía nhà cung cấp — dùng để đối chiếu/khử trùng về sau. */
  placeId?: string;
  /**
   * V65 — dịch vụ đã cấp `placeId`. Phải gửi ngược lên BE khi lưu: không có nhãn
   * này, BE coi bản ghi là "không rõ nguồn" và job làm mới toạ độ bỏ qua nó.
   */
  placeProvider?: PlaceProvider;
  /** Tách sẵn để form khỏi bắt operator gõ lại. */
  district?: string;
  city?: string;
}

/**
 * Địa điểm operator đã ghim, ở dạng form giữ trong state và gửi lên khi lưu.
 *
 * Metadata đi kèm toạ độ chứ không tách rời: BE dùng nó thay cho một lượt geocode
 * chỉ để lấy lại đúng những giá trị FE đang cầm sẵn. Prefill từ bản ghi cũ chỉ có
 * lat/lng — BE giữ nguyên metadata đang lưu khi không nhận được giá trị mới.
 */
export interface PinnedPlace {
  lat: number;
  lng: number;
  placeId?: string;
  placeProvider?: PlaceProvider;
  formattedAddress?: string;
  /**
   * Toạ độ này do người kéo ghim trên bản đồ, không phải lấy nguyên từ gợi ý.
   * BE dùng cờ này để job làm mới định kỳ KHÔNG kéo ghim về chỗ dịch vụ nói —
   * nếu không, công sửa tay bị xoá sau 180 ngày mà không ai hiểu vì sao.
   */
  pinnedByUser?: boolean;
}

/** Nhịp chờ trước khi hỏi server. Mỗi lượt gõ là một lượt tiêu hạn mức. */
const DEBOUNCE_MS = 350;
/** Dưới ngưỡng này thì gợi ý chỉ là nhiễu, không đáng một vòng gọi mạng. */
const MIN_QUERY_LENGTH = 3;

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
 * Ô "tìm theo địa điểm tự chọn" / ô nhập địa chỉ gym (UC-18).
 *
 * V65: gợi ý lấy từ proxy `/marketplace/geocode/autocomplete` của BE thay vì
 * Places Autocomplete chạy trong trình duyệt. Khoá API vì thế nằm lại phía
 * server, và FE không còn nạp SDK của nhà cung cấp nào.
 *
 * Không bao giờ để người dùng gặp một ô nhập chết: nhà cung cấp không hỗ trợ gợi
 * ý (hoặc chưa cấu hình khoá) thì mảng trả về rỗng, và nhấn Enter sẽ tra nguyên
 * chuỗi qua `/marketplace/geocode`.
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
  const listboxId = useId();

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolving, setResolving] = useState(false);

  // Người dùng vừa chọn một gợi ý -> `value` đổi theo, nhưng lần đổi đó KHÔNG
  // được kích hoạt một vòng gợi ý mới (nếu không danh sách bật lại ngay sau khi
  // vừa chọn xong).
  const skipNextQueryRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Gợi ý theo nhịp gõ ────────────────────────────────────────────────────
  useEffect(() => {
    if (skipNextQueryRef.current) {
      skipNextQueryRef.current = false;
      return;
    }
    const query = value.trim();
    if (disabled || query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Cờ này vừa huỷ debounce vừa vô hiệu hoá response đến muộn: gõ nhanh thì
    // request cũ có thể về SAU request mới và ghi đè bằng kết quả đã lỗi thời.
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const results = await marketplaceService.autocompletePlaces(query);
        if (!active) return;
        setSuggestions(results);
        setActiveIndex(-1);
        setOpen(results.length > 0);
      } catch {
        // Gợi ý hỏng không phải lỗi người dùng cần biết — ô nhập vẫn dùng được
        // bằng cách nhấn Enter. Báo toast ở đây chỉ tổ nhiễu khi mạng chập chờn.
        if (active) {
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, disabled]);

  // ── Bấm ra ngoài thì đóng ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function pick(suggestion: PlaceSuggestion) {
    if (suggestion.latitude == null || suggestion.longitude == null) {
      onError?.(t("marketplace.nearby.placeNotFound"));
      return;
    }
    const formattedAddress = suggestion.formattedAddress ?? suggestion.label ?? "";
    const label = suggestion.label ?? formattedAddress;

    skipNextQueryRef.current = true;
    onValueChange(label);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);

    onPlacePicked({
      lat: suggestion.latitude,
      lng: suggestion.longitude,
      label,
      formattedAddress,
      placeId: suggestion.placeId,
      placeProvider: suggestion.placeProvider,
      // Chuẩn hoá về đúng chuỗi trong danh mục VN_CITIES khi khớp: bộ lọc
      // marketplace gửi lên chuỗi của danh mục, lưu tên dạng khác là gym rớt
      // khỏi bộ lọc.
      district: canonicalDistrictName(suggestion.district) ?? suggestion.district,
      city: canonicalCityName(suggestion.city) ?? suggestion.city,
    });
  }

  /** Đường lui khi không có gợi ý nào: nhờ BE geocode nguyên chuỗi vừa gõ. */
  async function geocodeWholeQuery() {
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
      skipNextQueryRef.current = true;
      onValueChange(label);
      setOpen(false);
      // Nhánh này không trả district/city — form giữ nguyên giá trị operator đã
      // gõ thay vì bị xoá trắng.
      onPlacePicked({
        lat: result.latitude,
        lng: result.longitude,
        label,
        formattedAddress: label,
        placeId: result.placeId,
        placeProvider: result.placeProvider,
      });
    } catch {
      onError?.(t("marketplace.nearby.placeLookupFailed"));
    } finally {
      setResolving(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open || suggestions.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        // Cuộn vòng: từ mục cuối xuống lại về đầu danh sách.
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter") {
      // Enter trong ô này KHÔNG bao giờ được submit form bộ lọc bao ngoài.
      event.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        pick(suggestions[activeIndex]);
      } else {
        void geocodeWholeQuery();
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? t("marketplace.nearby.placePlaceholder")}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(suggestions.length > 0)}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        className={cn("pl-10 pr-11", className)}
      />
      {/*
        Định vị tuyệt đối đặt ở SPAN BỌC NGOÀI, không đặt thẳng lên IconButton.
        Khi bị disabled, IconButton tự bọc nút trong một <span> để tooltip vẫn
        nhận được hover — span đó nằm trong luồng bình thường và làm container
        `relative` cao thêm, khiến mốc `top-1/2` tụt xuống dưới tâm ô nhập và
        icon lệch hẳn xuống đáy. Nút này disabled ngay từ đầu (ô còn trống) nên
        lỗi hiện ra ở mọi lần tải trang.
      */}
      <span className="absolute right-1 top-1/2 -translate-y-1/2">
        <IconButton
          type="button"
          tooltip={t("marketplace.nearby.lookupPlace")}
          disabled={disabled || resolving || !value.trim()}
          onClick={() => void geocodeWholeQuery()}
          className="text-muted-foreground"
        >
          {resolving ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </IconButton>
      </span>

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.placeId ?? "s"}-${index}`}>
              <button
                type="button"
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // pointerdown chứ không click: listener đóng-khi-bấm-ra-ngoài cũng
                // chạy ở pointerdown, và input mất focus trước khi click kịp bắn.
                onPointerDown={(event) => {
                  event.preventDefault();
                  pick(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                )}
              >
                <span className="block font-medium">{suggestion.label}</span>
                {suggestion.formattedAddress && suggestion.formattedAddress !== suggestion.label && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {suggestion.formattedAddress}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
