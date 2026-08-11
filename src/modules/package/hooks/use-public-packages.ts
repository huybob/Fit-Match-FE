"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  marketplaceService,
  type GymPublicProfile,
  type GymSearchParams,
  type PublicTrainingPackage,
} from "@/services/marketplace.service";
import {
  maxPriceParam,
  minPriceParam,
  priceInRange,
  type PriceRange,
} from "@/shared/constants/vn-locations";

/**
 * Catalog gói tập toàn sàn cho trang /packages.
 *
 * BE CHƯA có endpoint list gói xuyên nhiều gym (chỉ có
 * `GET /marketplace/gyms/{id}/packages` cho MỘT gym). Ở đây gộp lại từ hai
 * endpoint public đang có: tìm gym theo bộ lọc, rồi lấy catalog của từng gym.
 * Khi BE có `GET /marketplace/packages` thì thay toàn bộ phần fetch bên dưới —
 * phần lọc/sắp xếp/phân trang ở component không phải sửa.
 *
 * Hệ quả của cách gộp này (đã tính đến trong UI):
 * - Chỉ quét {@link GYM_FAN_OUT_LIMIT} gym đầu tiên khớp bộ lọc; trang hiển thị
 *   cảnh báo khi còn gym chưa quét tới.
 * - keyword lọc phía client nên tìm được cả TÊN GÓI, không chỉ tên gym.
 */

/** Trần số gym quét một lần — cùng bậc với `size: 100` mà booking wizard dùng. */
const GYM_FAN_OUT_LIMIT = 100;

/**
 * Số request catalog chạy song song. HTTP/1.1 chỉ cho ~6 kết nối mỗi host nên
 * bắn 100 request cùng lúc không nhanh hơn, chỉ làm các request khác của trang
 * (ảnh, /user/profile) phải chờ sau hàng đợi.
 */
const FAN_OUT_CONCURRENCY = 6;

/** Một gói tập kèm gym đang bán nó — gói tự nó không mang thông tin gym. */
export interface PublicPackageItem {
  /** `id` gói là duy nhất toàn hệ thống; ghép gym để khoá React vẫn ổn định nếu BE đổi. */
  key: string;
  packageId: number;
  gymId: number;
  pkg: PublicTrainingPackage;
  gym: GymPublicProfile;
}

export type PackageSortValue = "default" | "priceAsc" | "priceDesc" | "mostSessions";

export interface PublicPackageFilters {
  /** Lọc phía client trên tên/mô tả gói và tên gym. */
  keyword?: string;
  city?: string;
  district?: string;
  priceRange?: PriceRange;
  sort: PackageSortValue;
}

interface PackageCatalog {
  items: PublicPackageItem[];
  /** Tổng số gym khớp bộ lọc theo BE. */
  totalGyms: number;
  /** Số gym thực sự đã quét catalog (≤ GYM_FAN_OUT_LIMIT). */
  scannedGyms: number;
}

type IdentifiedGym = GymPublicProfile & { id: number };

async function fetchCatalog(params: GymSearchParams): Promise<PackageCatalog> {
  const page = await marketplaceService.searchGyms({ ...params, page: 0, size: GYM_FAN_OUT_LIMIT });
  const gyms = (page.content ?? []).filter((gym): gym is IdentifiedGym => gym.id != null);

  const items: PublicPackageItem[] = [];
  for (let start = 0; start < gyms.length; start += FAN_OUT_CONCURRENCY) {
    const chunk = gyms.slice(start, start + FAN_OUT_CONCURRENCY);
    // allSettled, KHÔNG phải all: một gym vừa bị ẩn giữa hai request sẽ trả 404
    // và `all` sẽ giết cả trang. Bỏ qua gym lỗi, giữ phần còn lại.
    const results = await Promise.allSettled(
      chunk.map((gym) => marketplaceService.getGymPackages(gym.id)),
    );
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const gym = chunk[index];
      for (const pkg of result.value) {
        if (pkg.id == null) continue;
        items.push({ key: `${gym.id}-${pkg.id}`, packageId: pkg.id, gymId: gym.id, pkg, gym });
      }
    });
  }

  return {
    items,
    totalGyms: page.totalElements ?? gyms.length,
    scannedGyms: gyms.length,
  };
}

function matchesKeyword(item: PublicPackageItem, needle: string) {
  return [item.pkg.name, item.pkg.description, item.gym.gymName]
    .some((field) => field?.toLowerCase().includes(needle));
}

function compare(sort: PackageSortValue) {
  return (a: PublicPackageItem, b: PublicPackageItem) => {
    switch (sort) {
      case "priceAsc":
        return (a.pkg.price ?? 0) - (b.pkg.price ?? 0);
      case "priceDesc":
        return (b.pkg.price ?? 0) - (a.pkg.price ?? 0);
      case "mostSessions":
        return (b.pkg.sessionCount ?? 0) - (a.pkg.sessionCount ?? 0);
      default:
        return 0;
    }
  };
}

export function usePublicPackages(filters: PublicPackageFilters) {
  const { keyword, city, district, priceRange, sort } = filters;

  /**
   * Chỉ city/district/giá gửi lên BE (đều là bộ lọc cấp GYM). keyword giữ lại ở
   * client: BE chỉ so khớp tên/mô tả GYM, gửi lên sẽ loại mất chính những gym có
   * TÊN GÓI khớp — thứ mà người dùng trang này tìm.
   */
  const params: GymSearchParams = useMemo(
    () => ({
      city: city !== "all" ? city : undefined,
      district: district !== "all" ? district : undefined,
      minPrice: minPriceParam(priceRange),
      maxPrice: maxPriceParam(priceRange),
    }),
    [city, district, priceRange],
  );

  const query = useQuery({
    queryKey: ["marketplace", "packages", params],
    queryFn: () => fetchCatalog(params),
  });

  const all = query.data?.items;
  const items = useMemo(() => {
    if (!all) return [];
    const needle = keyword?.trim().toLowerCase();
    return all
      .filter((item) => {
        // BE lọc gym theo "có gói trong khoảng giá", nên gói NGOÀI khoảng của
        // chính gym đó vẫn về — phải lọc lại ở cấp gói.
        if (item.pkg.price != null && !priceInRange(item.pkg.price, priceRange)) return false;
        return !needle || matchesKeyword(item, needle);
      })
      .sort(compare(sort));
  }, [all, keyword, priceRange, sort]);

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    totalGyms: query.data?.totalGyms ?? 0,
    scannedGyms: query.data?.scannedGyms ?? 0,
    /** Còn gym khớp bộ lọc nhưng chưa quét tới — kết quả chưa đầy đủ. */
    truncated: (query.data?.totalGyms ?? 0) > (query.data?.scannedGyms ?? 0),
  };
}
