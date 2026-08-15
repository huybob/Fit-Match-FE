"use client";

import Link from "next/link";
import { Building2, MapPin, Phone, Search, ArrowLeft, BadgeCheck, Boxes, Clock, Dumbbell, Sparkles, GitBranch, Users, Heart, CalendarCheck, Navigation, Info } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  marketplaceService,
  type GymPublicProfile,
  type GymSearchParams,
  type PublicBranch,
} from "@/services/marketplace.service";
import { ticketService } from "@/services/ticket.service";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ReportIssueButton } from "@/modules/report/report-issue-button";
import { SiteLayout } from "@/modules/layout/site-layout";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { RatingStars } from "@/shared/components/common/rating-stars";
import { ImageGallery } from "@/shared/components/media/image-gallery";
import { SmartImage } from "@/shared/components/media/smart-image";
import { toGalleryImages } from "@/shared/utils/media.util";
import { PublicReviews } from "@/modules/review/components/public-reviews";
import { Button } from "@/shared/components/ui/button";
import { Pagination } from "@/shared/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  PRICE_RANGES,
  VN_CITIES,
  findPriceRange,
  maxPriceParam,
  minPriceParam,
  type PriceRangeValue,
} from "@/shared/constants/vn-locations";
import { toErrorMessage } from "@/shared/utils/error.util";
import { distanceKm, roundKm } from "@/shared/utils/geo.util";
import { formatCurrency } from "@/utils/format.util";
import { useTranslations } from "next-intl";
import { weekdayShortKey } from "@/shared/utils/enum-label.util";
import { SearchInput } from "@/shared/components/ui/search-input";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useToast } from "@/lib/toast-provider";
import { GymMap, type GymMapMarker } from "@/shared/components/map/gym-map";
import { NearbyLocationPicker, type SearchLocation } from "./nearby-location-picker";

/** A-11 (audit 2026-07-17): toggle yêu thích GYM cho customer — cùng mẫu với PT. */
function useGymFavorites() {
  const { user, status } = useAuthStore();
  const isCustomer = status === "authenticated" && user?.role === "ROLE_CUSTOMER";
  const qc = useQueryClient();
  const favQuery = useQuery({
    queryKey: ["favorites", "gyms"],
    queryFn: favoritesService.listGyms,
    enabled: isCustomer,
  });
  const ids = new Set((favQuery.data ?? []).map((g) => g.id));
  const toggle = useMutation({
    mutationFn: ({ id, fav }: { id: number; fav: boolean }) =>
      fav ? favoritesService.removeGym(id) : favoritesService.addGym(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", "gyms"] }),
  });
  return { isCustomer, ids, toggle };
}

function GymFavoriteButton({ gymId }: { gymId: number }) {
  const t = useTranslations();
  const { isCustomer, ids, toggle } = useGymFavorites();
  if (!isCustomer) return null;
  const fav = ids.has(gymId);
  return (
    <IconButton
      type="button"
      variant="outline"
      size="icon-sm"
      tooltip={fav ? t("common.actions.favoriteRemove") : t("common.actions.favoriteAdd")}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id: gymId, fav })}
      className="rounded-lg hover:border-destructive/30"
    >
      <Heart className={`size-4 ${fav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
    </IconButton>
  );
}

const NO_GYMS: GymPublicProfile[] = [];

/**
 * Lưới kết quả tối đa 3 cột — chọn bội của 6 để hàng cuối không bị lẻ ở cả
 * breakpoint 2 cột lẫn 3 cột.
 */
const PAGE_SIZE_OPTIONS = [12, 24, 48];

/**
 * Trần số ghim tải một lần cho bản đồ. Bản đồ phải ghim TOÀN BỘ gym trong bán
 * kính chứ không chỉ trang danh sách đang xem, nên đây là một lượt gọi riêng —
 * vẫn phải có trần để một bán kính rộng không kéo về hàng nghìn bản ghi.
 */
const MARKER_LIMIT = 200;

/** Số chi nhánh liệt kê thẳng trong card; phần dư gộp thành "+N chi nhánh khác". */
const BRANCHES_PER_CARD = 3;

/**
 * Số request catalog chi nhánh chạy song song. HTTP/1.1 chỉ cho ~6 kết nối mỗi
 * host — bắn cả trang cùng lúc không nhanh hơn, chỉ đẩy ảnh và các request khác
 * của trang xuống cuối hàng đợi.
 */
const BRANCH_FAN_OUT = 6;

/**
 * Chi nhánh của các gym ĐANG hiển thị. BE trả một dòng cho mỗi gym (kèm điểm gần
 * nhất) chứ không trải chi nhánh ra, nên card muốn liệt kê chi nhánh thì phải hỏi
 * thêm `GET /marketplace/gyms/{id}/branches` — endpoint công khai đã có sẵn.
 *
 * Chỉ quét đúng các gym của trang hiện tại (≤ pageSize request): fan-out theo cả
 * tập kết quả bán kính (tới {@link MARKER_LIMIT} gym) thì một lần đổi bộ lọc là
 * hàng trăm request.
 */
async function fetchBranchesOf(gymIds: number[]): Promise<Record<number, PublicBranch[]>> {
  const byGym: Record<number, PublicBranch[]> = {};
  for (let start = 0; start < gymIds.length; start += BRANCH_FAN_OUT) {
    const chunk = gymIds.slice(start, start + BRANCH_FAN_OUT);
    // allSettled, KHÔNG phải all: một gym vừa bị ẩn giữa hai request sẽ trả 404 và
    // `all` sẽ giết cả danh sách. Gym lỗi chỉ mất phần chi nhánh, card vẫn hiện.
    const results = await Promise.allSettled(chunk.map((id) => marketplaceService.getGymBranches(id)));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") byGym[chunk[index]] = result.value;
    });
  }
  return byGym;
}

export function GymsPublicPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  // Bug 11: vị trí lọc theo thành phố + quận (dropdown) thay vì ô text tự do.
  const [city, setCity] = useState("all");
  const [district, setDistrict] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceRangeValue>("all");
  // Bug S2-19: các dropdown (thành phố/quận/mức giá) áp dụng NGAY khi đổi. Trước đây
  // mọi bộ lọc đều nằm chờ nút "Áp dụng" ở cuối form nên chọn mức giá xong thấy
  // danh sách y nguyên -> tưởng filter hỏng. Chỉ ô từ khoá còn chờ submit.
  const [appliedKeyword, setAppliedKeyword] = useState("");
  // UC-008: sắp xếp kết quả — sort theo field entity (BE Spring Pageable).
  const [sort, setSort] = useState("createdAt,desc");
  // UC-18 (V55): tâm + bán kính tìm kiếm. KHÔNG gộp vào `params` vì hai nhóm này
  // được áp dụng khác nhau: bộ lọc text chờ bấm "Áp dụng", còn đổi vị trí/bán
  // kính phải cho kết quả ngay (người dùng vừa bấm "Vị trí của tôi" và đang đợi).
  const [location, setLocation] = useState<SearchLocation | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  /** Ghim đang mở popup, theo khoá của {@link GymMapMarker} (`gym-7` / `branch-7`). */
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  // Phân trang server-side: BE (`GET /marketplace/gyms`) nhận page/size/sort của
  // Spring Pageable. Trang đánh số từ 0 để khỏi quy đổi ở tầng gọi API.
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const resultsRef = useRef<HTMLElement>(null);

  // Bug S2-19: `min: 0` là giá trị hợp lệ nhưng falsy — code cũ (`range.min ? … :
  // undefined`) âm thầm bỏ nó đi. Và `maxPrice` phải trừ 1 vì BE so sánh `<=` còn
  // khoảng giá là nửa mở: nếu không, gói đúng 1.000.000 đ khớp cả "Dưới 1 triệu"
  // lẫn "1 – 3 triệu" và người dùng thấy kết quả mâu thuẫn giữa hai lựa chọn.
  const params: GymSearchParams = useMemo(() => {
    const range = findPriceRange(priceFilter);
    return {
      keyword: appliedKeyword || undefined,
      city: city !== "all" ? city : undefined,
      district: district !== "all" ? district : undefined,
      minPrice: minPriceParam(range),
      maxPrice: maxPriceParam(range),
    };
  }, [appliedKeyword, city, district, priceFilter]);

  /**
   * Đổi bộ lọc / thứ tự / vị trí thì tập kết quả khác hẳn — đang ở trang 5 mà kết
   * quả mới chỉ có 2 trang sẽ ra màn hình trắng. Điều chỉnh NGAY trong lúc render
   * (không qua effect) và trước `useQuery`: làm ở effect thì React đã kịp gửi
   * request cho cặp "bộ lọc mới + trang cũ" rồi mới gửi tiếp request trang đầu.
   */
  const filterKey = JSON.stringify([params, sort, location, radiusKm, pageSize]);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const query = useQuery({
    queryKey: ["marketplace", "gyms", params, sort, location, radiusKm, page, pageSize],
    queryFn: () =>
      marketplaceService.searchGyms({
        ...params,
        page,
        size: pageSize,
        // Có vị trí thì BE luôn sắp theo khoảng cách và bỏ qua sort — không gửi
        // `sort` để khỏi ngụ ý một thứ tự không có thật.
        ...(location
          ? { lat: location.lat, lng: location.lng, radiusKm }
          : { sort }),
      }),
    // Giữ kết quả trang cũ trong lúc tải trang mới: nếu không, mỗi lần bấm số
    // trang cả lưới bị thay bằng skeleton và trang nhảy giật.
    placeholderData: keepPreviousData,
  });

  /**
   * Ghim bản đồ lấy từ một lượt gọi RIÊNG, không dùng lại trang danh sách: bản đồ
   * vẽ cả vùng bán kính nên chỉ ghim 12 gym của trang hiện tại sẽ khiến vùng còn
   * lại trông như không có phòng tập nào. Chỉ chạy khi đã chọn tâm — cũng đúng lúc
   * bản đồ được hiển thị.
   */
  const markerQuery = useQuery({
    queryKey: ["marketplace", "gyms", "markers", params, location, radiusKm],
    queryFn: () =>
      marketplaceService.searchGyms({
        ...params,
        lat: location!.lat,
        lng: location!.lng,
        radiusKm,
        page: 0,
        size: MARKER_LIMIT,
      }),
    enabled: !!location,
  });

  /**
   * Toạ độ TRỤ SỞ của gym. Truy vấn tìm-quanh-đây ghi đè `latitude/longitude`
   * bằng ĐIỂM GẦN NHẤT (thường là một chi nhánh), nên nếu chỉ dựa vào nó thì địa
   * chỉ của chính phòng gym không bao giờ được ghim. Hỏi thêm một lượt KHÔNG kèm
   * lat/lng: cùng bộ lọc nên tập trả về là tập cha của kết quả bán kính, và chỉ
   * tốn ĐÚNG một request cho mỗi lần đổi bộ lọc (không nhân theo số gym).
   */
  const hqQuery = useQuery({
    queryKey: ["marketplace", "gyms", "hq", params],
    queryFn: () => marketplaceService.searchGyms({ ...params, page: 0, size: MARKER_LIMIT }),
    enabled: !!location,
  });
  const hqById = useMemo(() => {
    const map = new Map<number, { lat: number; lng: number }>();
    for (const gym of hqQuery.data?.content ?? NO_GYMS) {
      if (gym.id != null && gym.latitude != null && gym.longitude != null) {
        map.set(gym.id, { lat: gym.latitude, lng: gym.longitude });
      }
    }
    return map;
  }, [hqQuery.data]);

  const districts = VN_CITIES.find((c) => c.name === city)?.districts ?? [];

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setAppliedKeyword(keyword);
  }
  function clearAll() {
    setKeyword(""); setAppliedKeyword("");
    setCity("all"); setDistrict("all"); setPriceFilter("all");
    setLocation(null); setActiveMarkerId(null);
  }

  // Hằng số module, không phải `[]` mới mỗi render — nếu không thì memo bên dưới
  // vô hiệu suốt thời gian query đang tải.
  const items = query.data?.content ?? NO_GYMS;
  const total = query.data?.totalElements ?? items.length;
  const totalPages = query.data?.totalPages ?? 1;

  /**
   * Nút phân trang nằm dưới cùng: đổi trang mà không cuộn lên thì người dùng
   * tiếp đất giữa lưới mới và tưởng danh sách không đổi.
   */
  function goToPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const markerItems = markerQuery.data?.content ?? NO_GYMS;

  /** Id các gym đang hiển thị — khoá của query chi nhánh bên dưới. */
  const pageGymIds = useMemo(
    () => items.map((gym) => gym.id).filter((id): id is number => id != null),
    [items],
  );
  const branchesQuery = useQuery({
    queryKey: ["marketplace", "gyms", "branches", pageGymIds],
    queryFn: () => fetchBranchesOf(pageGymIds),
    enabled: pageGymIds.length > 0,
    placeholderData: keepPreviousData,
  });
  const branchesByGym = branchesQuery.data;

  /**
   * Chi nhánh của một gym, kèm khoảng cách tự tính khi đang tìm theo bán kính —
   * BE chỉ chấm khoảng cách cho ĐIỂM GẦN NHẤT của gym, các chi nhánh còn lại
   * không có số nào. Sắp gần → xa để chi nhánh đáng đi nhất nằm trên đầu.
   */
  const branchesOf = useMemo(() => {
    return (gymId?: number) => {
      if (gymId == null) return [];
      const list = branchesByGym?.[gymId] ?? [];
      return list
        .map((branch) => ({
          branch,
          distance:
            location && branch.latitude != null && branch.longitude != null
              ? roundKm(distanceKm(location, { lat: branch.latitude, lng: branch.longitude }))
              : undefined,
        }))
        .sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
    };
  }, [branchesByGym, location]);

  // Chỉ địa điểm đã có toạ độ mới ghim được; nơi chưa geocode vẫn nằm trong danh
  // sách. Memo hoá vì mảng này là dependency của effect vẽ ghim trong GymMap — tạo
  // mảng mới mỗi lần render (kể cả khi chỉ hover một card) sẽ bắt bản đồ vẽ lại liên tục.
  const { markers, markerIdOfGym, markerOwner } = useMemo(() => {
    const list: GymMapMarker[] = [];
    /** Ghim đã đặt tại một toạ độ — tránh hai ghim chồng khít lên nhau. */
    const takenSpots = new Map<string, string>();
    const idOfGym = new Map<number, string>();
    /** Ghim thuộc về ai — để bấm ghim là sáng đúng card, đúng dòng chi nhánh. */
    const owner = new Map<string, { gymId: number; branchId?: number }>();
    const spotKey = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

    // Chi nhánh trước: ghim của chúng nói rõ "Chi nhánh của X" nên khi trùng chỗ
    // với điểm-gần-nhất của gym thì nó là nhãn giàu thông tin hơn.
    for (const gym of markerItems) {
      if (gym.id == null) continue;
      for (const { branch, distance } of branchesOf(gym.id)) {
        if (branch.latitude == null || branch.longitude == null) continue;
        // Đang lọc theo bán kính thì chi nhánh nằm ngoài vòng tròn không được ghim:
        // nó không phải kết quả của lần tìm này.
        if (location && distance != null && distance > radiusKm) continue;
        const key = spotKey(branch.latitude, branch.longitude);
        if (takenSpots.has(key)) continue;
        const id = `branch-${branch.id}`;
        takenSpots.set(key, id);
        if (branch.id != null) owner.set(id, { gymId: gym.id, branchId: branch.id });
        list.push({
          id,
          kind: "branch",
          title: branch.name ?? t("marketplace.branches"),
          lat: branch.latitude,
          lng: branch.longitude,
          subtitle: t("marketplace.branchOf", { name: gym.gymName ?? "" }),
          address: [branch.address, branch.district, branch.city].filter(Boolean).join(", ") || undefined,
          distanceLabel: distance != null ? t("marketplace.nearby.awayKm", { km: distance }) : undefined,
          href: `/gyms/${gym.id}`,
        });
      }
    }

    for (const gym of markerItems) {
      if (gym.id == null) continue;
      // Trụ sở trước, điểm-gần-nhất chỉ là đường lui (gym không có trong tập trụ
      // sở vì vượt trần MARKER_LIMIT). Ghim trụ sở mới là ghim mang địa chỉ gym.
      const hq = hqById.get(gym.id);
      const lat = hq?.lat ?? gym.latitude;
      const lng = hq?.lng ?? gym.longitude;
      if (lat == null || lng == null) continue;
      // Trụ sở nằm ngoài vòng tròn thì không ghim: nó không thuộc phạm vi đang tìm
      // (chi nhánh trong bán kính mới là lý do gym này lọt vào kết quả).
      const hqDistance = location ? roundKm(distanceKm(location, { lat, lng })) : undefined;
      if (location && hqDistance != null && hqDistance > radiusKm) continue;
      const key = spotKey(lat, lng);
      const taken = takenSpots.get(key);
      if (taken) {
        // Điểm gần nhất của gym CHÍNH LÀ một chi nhánh đã ghim. Không chồng thêm
        // ghim thứ hai, nhưng vẫn nhớ ghim nào đại diện cho gym này để trỏ chuột
        // vào card còn mở đúng popup.
        idOfGym.set(gym.id, taken);
        continue;
      }
      const id = `gym-${gym.id}`;
      takenSpots.set(key, id);
      idOfGym.set(gym.id, id);
      owner.set(id, { gymId: gym.id });
      list.push({
        id,
        kind: "gym",
        title: gym.gymName ?? t("marketplace.gym"),
        lat,
        lng,
        // Ghim trụ sở luôn mang ĐỊA CHỈ CỦA GYM: người xem bản đồ cần biết phòng
        // tập nằm ở đâu chứ không chỉ mỗi cái tên.
        subtitle: t("marketplace.gymHq"),
        address: [gym.address, gym.district, gym.city].filter(Boolean).join(", ") || undefined,
        // Khoảng cách của CHÍNH trụ sở; `gym.distanceKm` của BE là khoảng cách tới
        // điểm gần nhất (có thể là chi nhánh) nên chỉ dùng khi không tính được.
        distanceLabel:
          hqDistance != null
            ? t("marketplace.nearby.awayKm", { km: hqDistance })
            : gym.distanceKm != null
              ? t("marketplace.nearby.awayKm", { km: gym.distanceKm })
              : undefined,
        // Ghim có thể thuộc gym KHÔNG nằm ở trang danh sách đang xem — cho đi
        // thẳng vào trang chi tiết thay vì bắt người dùng dò lại từng trang.
        href: `/gyms/${gym.id}`,
      });
    }

    return { markers: list, markerIdOfGym: idOfGym, markerOwner: owner };
  }, [markerItems, branchesOf, hqById, location, radiusKm, t]);

  /**
   * Ghim đang mở popup thuộc gym nào / chi nhánh nào. Bấm ghim chi nhánh phải
   * sáng CẢ card của gym mẹ lẫn đúng dòng chi nhánh trong card — nếu chỉ sáng
   * card thì người dùng vẫn phải tự dò xem ghim vừa bấm là chi nhánh nào.
   */
  const active = activeMarkerId ? markerOwner.get(activeMarkerId) : undefined;

  /** Card của gym có thể đang nằm ngoài tầm nhìn khi người dùng bấm ghim. */
  function focusMarker(id: string) {
    setActiveMarkerId(id);
    const gymId = markerOwner.get(id)?.gymId;
    if (gymId == null) return;
    document.getElementById(`gym-card-${gymId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /** Còn gym trong bán kính nhưng vượt trần ghim — nói thẳng thay vì lặng lẽ cắt. */
  const markersCapped = (markerQuery.data?.totalElements ?? 0) > markerItems.length;

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filter sidebar */}
          <aside className="w-full shrink-0 lg:w-72">
            <form onSubmit={apply} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">{t("marketplace.filters")}</h2>
                <Button variant="link" size="inline" type="button" onClick={clearAll} className="text-primary">{t("marketplace.resetFilters")}</Button>
              </div>

              {/* UC-18 (V55): tìm quanh một vị trí — áp dụng ngay, không chờ nút "Áp dụng". */}
              <div className="mt-4 border-b border-border pb-4">
                <NearbyLocationPicker
                  location={location}
                  onLocationChange={(next) => { setLocation(next); setActiveMarkerId(null); }}
                  radiusKm={radiusKm}
                  onRadiusChange={setRadiusKm}
                  onError={(message) => toast({ type: "error", title: message })}
                />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("marketplace.keyword")}</p>
                <SearchInput
                    className="h-10"
                    placeholder={t("marketplace.searchGymPlaceholder")}
                    value={keyword}
                    onValueChange={setKeyword}
                  />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.city")}</p>
                <Select value={city} onValueChange={(v) => { setCity(v); setDistrict("all"); }}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("marketplace.allCities")}</SelectItem>
                    {VN_CITIES.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("marketplace.district")}</p>
                <Select value={district} onValueChange={setDistrict} disabled={city === "all"}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder={city === "all" ? t("marketplace.pickCityFirst") : undefined} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("marketplace.allDistricts")}</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("marketplace.priceRange")}</p>
                <Select value={priceFilter} onValueChange={(v) => setPriceFilter(v as PriceRangeValue)}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="mt-5 w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Search className="size-4" />{t("common.actions.apply")}</Button>
            </form>
          </aside>

          {/* Results */}
          <section ref={resultsRef} className="min-w-0 flex-1 scroll-mt-4">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("marketplace.gymsNearYou")}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{location
              ? t("marketplace.nearby.foundGymsWithin", { count: total, km: radiusKm, place: location.label })
              : params.city
              ? t("marketplace.foundGymsNear", { count: total, city: params.city })
              : t("marketplace.foundGyms", { count: total })}</p>
              </div>
              {/* Đang tìm theo bán kính thì thứ tự luôn là "gần nhất trước" — hiện nhãn
                  tĩnh thay vì dropdown vô hiệu để khỏi mời người dùng bấm vào chỗ chết. */}
              {location ? (
                <span className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground">
                  <Navigation className="size-4 text-primary" /> {t("marketplace.nearby.sortByDistance")}
                </span>
              ) : (
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt,desc">{t("marketplace.sortNewest")}</SelectItem>
                    {/* UC-008 (V51): sort theo cột denorm avg_rating */}
                    <SelectItem value="avgRating,desc">{t("marketplace.sortTopRated")}</SelectItem>
                    <SelectItem value="gymName,asc">{t("marketplace.sortNameAsc")}</SelectItem>
                    <SelectItem value="gymName,desc">{t("marketplace.sortNameDesc")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Bản đồ chỉ có ý nghĩa khi đã chọn tâm tìm kiếm. */}
            {location && (
              <div className="mb-5">
                <GymMap
                  className="h-80 w-full"
                  center={location}
                  radiusKm={radiusKm}
                  markers={markers}
                  activeId={activeMarkerId}
                  onMarkerClick={focusMarker}
                  onCenterPick={(position) => {
                    setActiveMarkerId(null);
                    setLocation({ ...position, label: t("marketplace.nearby.pickedOnMap") });
                  }}
                />
                {markersCapped && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-warning">
                    <Info className="mt-px size-3.5 shrink-0" />
                    {t("marketplace.nearby.markersCapped", {
                      shown: markers.length,
                      total: markerQuery.data?.totalElements ?? markers.length,
                    })}
                  </p>
                )}
              </div>
            )}

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title={t("marketplace.gymLoadError")} description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <>
              {/* Mờ đi trong lúc tải trang kế — vẫn đọc được, nhưng thấy rõ là dữ liệu cũ. */}
              <div
                className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
                  query.isFetching ? "opacity-60 transition-opacity" : ""
                }`}
              >
                {items.map((gym) => {
                  const branches = branchesOf(gym.id);
                  const activeBranchId = active && active.gymId === gym.id ? active.branchId : undefined;
                  const shownBranches = branches.slice(0, BRANCHES_PER_CARD);
                  // Ghim vừa bấm có thể là chi nhánh nằm trong phần bị gộp thành
                  // "+N chi nhánh khác" — kéo nó lên, nếu không thì dòng được sáng
                  // lại là dòng người dùng không nhìn thấy.
                  if (activeBranchId != null && !shownBranches.some((b) => b.branch.id === activeBranchId)) {
                    const hidden = branches.find((b) => b.branch.id === activeBranchId);
                    if (hidden) shownBranches.push(hidden);
                  }
                  const hiddenBranches = branches.length - shownBranches.length;
                  // Ghim đại diện cho gym: thường là `gym-<id>`, nhưng khi điểm gần
                  // nhất chính là một chi nhánh thì bản đồ chỉ có ghim của chi nhánh đó.
                  const gymMarkerId = gym.id != null ? markerIdOfGym.get(gym.id) : undefined;
                  return (
                  <article
                    key={gym.id}
                    id={`gym-card-${gym.id}`}
                    // Trỏ vào card thì ghim tương ứng mở InfoWindow — nối danh sách với bản đồ.
                    onMouseEnter={() => location && gymMarkerId && setActiveMarkerId(gymMarkerId)}
                    // Sáng card khi ghim đang mở thuộc gym này — kể cả khi đó là ghim
                    // của một chi nhánh, vì chi nhánh nằm trong chính card này.
                    className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors ${
                      gym.id != null && active?.gymId === gym.id
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border"
                    }`}
                  >
                    {/* A-19: gỡ badge t("marketplace.openNow") hardcode — giờ mở cửa thật ở trang chi tiết */}
                    {/* Bug 11: ảnh thật của gym nếu có media, fallback gradient. */}
                    {gym.coverUrl ? (
                      // SmartImage: signed URL hết hạn / ảnh đã bị xoá thì rơi về ô
                      // dự phòng thay vì icon "ảnh vỡ" của trình duyệt.
                      <SmartImage
                        src={gym.coverUrl}
                        alt={gym.gymName ?? t("marketplace.gym")}
                        className="h-36 w-full bg-muted/40 object-cover"
                      />
                    ) : (
                      <div className="relative grid h-36 place-items-center bg-gradient-to-br from-primary to-primary text-primary-foreground">
                        <Building2 className="size-12 opacity-90" />
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="text-base font-bold text-foreground">{gym.gymName}</h2>
                      {/* Bug 5/11: sao đánh giá ngay trên card. */}
                      <div className="mt-1"><RatingStars rating={gym.averageRating} count={gym.reviewCount} /></div>
                      {(gym.address || gym.district || gym.city) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />{[gym.address, gym.district, gym.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {gym.distanceKm != null && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary">
                          <Navigation className="size-3.5" />
                          {t("marketplace.nearby.awayKm", { km: gym.distanceKm })}
                          {/* Khoảng cách tính theo chi nhánh gần nhất chứ không phải trụ sở —
                              nói rõ chi nhánh nào để con số không gây hiểu nhầm. */}
                          {gym.nearestBranchName && (
                            <span className="font-normal text-muted-foreground">
                              · {t("marketplace.nearby.viaBranch", { branch: gym.nearestBranchName })}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{gym.description || t("marketplace.noDescription")}</p>

                      {/* Chi nhánh của chính gym này: khách tìm theo khu vực cần biết
                          cơ sở nào gần mình, không chỉ địa chỉ trụ sở. Mỗi dòng trỏ
                          chuột vào là ghim tương ứng trên bản đồ mở popup. */}
                      {branches.length > 0 && (
                        <div className="mt-3 border-t border-border pt-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                            {t("marketplace.branchCount", { count: branches.length })}
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {shownBranches.map(({ branch, distance }) => (
                              <li
                                key={branch.id}
                                onMouseEnter={() => location && setActiveMarkerId(`branch-${branch.id}`)}
                                // Bấm ghim chi nhánh trên bản đồ -> sáng đúng dòng này.
                                className={`flex items-start gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] leading-4 transition-colors ${
                                  activeBranchId != null && activeBranchId === branch.id
                                    ? "bg-primary/10 font-semibold text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <GitBranch className="mt-0.5 size-3 shrink-0 text-primary" />
                                <span className="min-w-0">
                                  <span className="font-semibold text-foreground">{branch.name}</span>
                                  {[branch.address, branch.district].filter(Boolean).length > 0 && (
                                    <> · {[branch.address, branch.district].filter(Boolean).join(", ")}</>
                                  )}
                                  {distance != null && (
                                    <span className="font-semibold text-primary">
                                      {" "}· {t("marketplace.nearby.awayKm", { km: distance })}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {hiddenBranches > 0 && (
                            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                              {t("marketplace.moreBranches", { count: hiddenBranches })}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        {gym.id != null ? <GymFavoriteButton gymId={gym.id} /> : <span />}
                        <Link
                          href={`/gyms/${gym.id}`}
                          className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
                        >{t("common.actions.viewDetail")}</Link>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>

              <Pagination
                className="mt-6"
                page={page}
                zeroBased
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                pageSizeLabel={t("common.pagination.itemsPerPage")}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                disabled={query.isFetching}
              />
              </>
            ) : (
              <EmptyState title={t("marketplace.noGymFound")} description={t("marketplace.noGymFoundHint")} />
            )}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

export function GymPublicDetailPage({ gymId }: { gymId: number }) {
  const t = useTranslations();
  const gym = useQuery({
    queryKey: ["marketplace", "gym", gymId],
    queryFn: () => marketplaceService.getGym(gymId),
  });
  // B-25 (audit 2026-07-17): trước đây trang chỉ hiển thị 5 field hồ sơ — catalog
  // PUBLISHED không có bề mặt hiển thị nào dù endpoint public đã đủ.
  const branches = useQuery({
    queryKey: ["marketplace", "gym", gymId, "branches"],
    queryFn: () => marketplaceService.getGymBranches(gymId),
    enabled: !!gym.data,
  });

  // Vé bán theo CHI NHÁNH (câu 20) nên phải hỏi từng chi nhánh rồi gom lại —
  // dùng cho khoảng giá ở đầu trang và danh sách vé trong thẻ chi nhánh.
  const branchIds = (branches.data ?? []).map((b) => b.id).filter((id): id is number => id != null);
  const ticketTypeQueries = useQueries({
    queries: branchIds.map((branchId) => ({
      queryKey: ["marketplace", "branch", branchId, "ticket-types"],
      queryFn: () => ticketService.listBranchTicketTypes(branchId),
    })),
  });
  const ticketTypesByBranch = new Map(
    branchIds.map((branchId, index) => [branchId, ticketTypeQueries[index]?.data ?? []]),
  );
  const branchTicketTypes = ticketTypeQueries.flatMap((query) => query.data ?? []);
  const pts = useQuery({
    queryKey: ["marketplace", "gym", gymId, "pts"],
    queryFn: () => marketplaceService.getGymPts(gymId),
    enabled: !!gym.data,
  });
  // UC-047: cơ sở vật chất gym tự khai — trước đây gym nhập và tải ảnh lên nhưng
  // không màn nào của khách đọc ra, ảnh nằm im trên bucket.
  const facilities = useQuery({
    queryKey: ["marketplace", "gym", gymId, "facilities"],
    queryFn: () => marketplaceService.getGymFacilities(gymId),
    enabled: !!gym.data,
  });
  // Bug 10: ảnh gym/chi nhánh từ media công khai (trước đây endpoint có nhưng không dùng).
  const media = useQuery({
    queryKey: ["marketplace", "gym", gymId, "media"],
    queryFn: () => marketplaceService.getGymMedia(gymId),
    enabled: !!gym.data,
  });

  if (gym.isLoading)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-6xl px-4 py-10"><LoadingSkeleton /></main>
      </SiteLayout>
    );
  if (gym.isError || !gym.data)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-4xl px-4 py-10">
          <EmptyState title={t("marketplace.noGymFound")} description={toErrorMessage(gym.error)} />
        </main>
      </SiteLayout>
    );

  const g = gym.data;
  const fullAddress = [g.address, g.district, g.city].filter(Boolean).join(", ");
  // Bug 10: khoảng giá lấy từ vé đang bán ở các chi nhánh của gym.
  const prices = branchTicketTypes.map((type) => type.price).filter((p): p is number => p != null && p > 0);
  const priceLabel = prices.length
    ? Math.min(...prices) === Math.max(...prices)
      ? formatCurrency(Math.min(...prices))
      : `${formatCurrency(Math.min(...prices))} – ${formatCurrency(Math.max(...prices))}`
    : t("marketplace.contactGym");
  // Bug 10: giờ hoạt động tổng quát = khung sớm nhất – muộn nhất giữa các chi nhánh.
  const allHours = (branches.data ?? [])
    .flatMap((b) => b.operatingHours ?? [])
    .filter((h) => !h.closed && h.openTime && h.closeTime);
  const hoursLabel = allHours.length
    ? `${allHours.reduce((min, h) => (h.openTime! < min ? h.openTime! : min), allHours[0].openTime!).slice(0, 5)}–${allHours.reduce((max, h) => (h.closeTime! > max ? h.closeTime! : max), allHours[0].closeTime!).slice(0, 5)}`
    : t("common.states.notSet");
  const gymPhotos = toGalleryImages((media.data ?? []).filter((m) => m.branchId == null));
  const photosOfBranch = (branchId?: number) =>
    toGalleryImages((media.data ?? []).filter((m) => m.branchId != null && m.branchId === branchId));
  // Nút "Đặt lịch" mở popup mua vé của CHÍNH gym này. Trước đây nó trỏ về
  // `/gyms/{id}` — tức đúng trang đang đứng, một nút không làm gì cả.
  const bookingHref = `/checkout?gymId=${gymId}`;
  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/gyms" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> {t("marketplace.backToList")}
        </Link>

        {/* Hero cover */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative h-48 bg-gradient-to-br from-primary via-primary to-primary sm:h-56">
            {/* Ảnh bìa giống hệt card danh sách — mở chi tiết mà mất ảnh thì trông
                như vào nhầm gym. Chưa đặt bìa thì rơi về nền gradient + icon. */}
            {g.coverUrl ? (
              <SmartImage
                src={g.coverUrl}
                alt={g.gymName ?? t("marketplace.gym")}
                loading="eager"
                className="absolute inset-0 size-full object-cover"
                fallbackClassName="bg-transparent"
                fallback={<Building2 className="size-28 text-success-foreground opacity-20" />}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center opacity-20"><Building2 className="size-28 text-success-foreground" /></div>
            )}
            {/* Bug 14: badge data-driven — chỉ hiện khi hồ sơ thật sự APPROVED. */}
            {g.verified && (
              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
                <BadgeCheck className="size-3.5" /> {t("marketplace.verified")}
              </span>
            )}
          </div>
          <div className="px-6 pb-6 pt-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-foreground">{g.gymName}</h1>
                <div className="mt-1"><RatingStars rating={g.averageRating} count={g.reviewCount} /></div>
                {fullAddress && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" />{fullAddress}
                  </p>
                )}
              </div>
              {/* A-19: gỡ badge t("marketplace.openNow") hardcode — giờ mở cửa thật hiển thị theo chi nhánh bên dưới */}
              {/* A-11: yêu thích gym ngay từ trang chi tiết */}
              <div className="flex items-center gap-2">
                {/* UC-070: báo cáo vấn đề dịch vụ/hành vi của gym */}
                <ReportIssueButton targetType="GYM" targetId={gymId} targetName={g.gymName} />
                <GymFavoriteButton gymId={gymId} />
                <Link
                  href={bookingHref}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <CalendarCheck className="size-4" /> {t("marketplace.book")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bug 10: đúng 3 ô giữa — địa chỉ chi tiết / SĐT-hotline / giá + giờ hoạt động
            (trước đây địa chỉ và SĐT bị lặp giữa các ô + thẻ t("marketplace.contact")). */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{t("common.table.address")}</span>
            </div>
            <p className="mt-1.5 text-[15px] font-bold text-foreground">{fullAddress || "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{t("marketplace.phoneHotline")}</span>
            </div>
            <p className="mt-1.5 text-[15px] font-bold text-foreground">{g.phone || "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{t("marketplace.priceAndHours")}</span>
            </div>
            <p className="mt-1.5 text-[15px] font-bold text-primary">{priceLabel}</p>
            <p className="text-xs text-muted-foreground">{t("marketplace.openingHours")} {hoursLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* About */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Dumbbell className="size-5 text-primary" /> {t("marketplace.about")}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{g.description || t("marketplace.noAboutGym")}</p>
          </section>

          {/* Bug 10: thẻ t("marketplace.contact") trùng lặp -> CTA đặt lịch. */}
          <aside className="rounded-2xl border border-primary/20 bg-primary/10 p-6 h-max">
            <h3 className="text-sm font-bold text-foreground">{t("marketplace.readyTitle")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("marketplace.readyBody", { name: g.gymName ?? "" })}
            </p>
            <Link
              href={bookingHref}
              className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CalendarCheck className="size-4" /> {t("marketplace.bookNow")}
            </Link>
          </aside>
        </div>

        {/* Cơ sở vật chất — mục riêng ngay dưới Giới thiệu. Chỉ dựng khi gym
            thật sự có khai: một mục trống chỉ nói với khách rằng trang chưa xong. */}
        {facilities.data?.length ? (
          <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Boxes className="size-5 text-primary" /> {t("marketplace.facilities")}
            </h2>
            <div className="mt-4 space-y-5">
              {facilities.data.map((facility) => (
                <div key={facility.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{facility.name}</h3>
                    {facility.branchName ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {facility.branchName}
                      </span>
                    ) : null}
                  </div>
                  {facility.description ? (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {facility.description}
                    </p>
                  ) : null}
                  {facility.images?.length ? (
                    <ImageGallery images={toGalleryImages(facility.images)} columns={4} className="mt-3" />
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Bug 10/11: ảnh của phòng gym (media công khai). */}
        {!!gymPhotos.length && (
          <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Sparkles className="size-5 text-primary" /> {t("marketplace.photos")}</h2>
            {/* V64: lưới dùng thumbnail + mở lightbox; ảnh hỏng/URL hết hạn rơi
                về ô dự phòng thay vì icon "ảnh vỡ" của trình duyệt. */}
            <ImageGallery images={gymPhotos} columns={4} className="mt-4" />
          </section>
        )}

        {/* Dịch vụ + gói tập đã bị gỡ cùng mô hình booking: vé bán theo CHI
            NHÁNH (câu 20), nên danh sách vé nằm ngay trong thẻ chi nhánh bên dưới. */}
        {/* B-25: {t("marketplace.branches")} + giờ mở cửa thật */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><GitBranch className="size-5 text-primary" /> {t("marketplace.branches")}</h2>
          {branches.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(branches.data ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("marketplace.noBranches")}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(branches.data ?? []).map((b) => (
                <div key={b.id} className="rounded-2xl border border-border p-4">
                  <p className="font-bold text-foreground">{b.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{[b.address, b.district, b.city].filter(Boolean).join(", ")}</p>
                  {b.amenities && <p className="mt-1 text-[11px] text-muted-foreground">{t("marketplace.amenitiesLabel")} {b.amenities}</p>}
                  {!!b.operatingHours?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {b.operatingHours
                        .filter((h) => !h.closed && h.dayOfWeek != null)
                        .sort((a, c) => (a.dayOfWeek ?? 0) - (c.dayOfWeek ?? 0))
                        .map((h) => (
                          <span key={h.dayOfWeek} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {t(weekdayShortKey(h.dayOfWeek!))} {h.openTime?.slice(0, 5)}–{h.closeTime?.slice(0, 5)}
                          </span>
                        ))}
                    </div>
                  )}
                  {/* Câu 20: vé bán theo chi nhánh — bấm vào là sang thẳng
                      màn mua vé của đúng chi nhánh đó. */}
                  {(ticketTypesByBranch.get(b.id!) ?? []).length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {(ticketTypesByBranch.get(b.id!) ?? []).map((type) => (
                        <li key={type.id}>
                          <Link
                            href={`/checkout?branchId=${b.id}&ticketTypeId=${type.id}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:border-primary"
                          >
                            <span className="min-w-0 truncate">
                              {type.name}
                              <span className="ml-1 text-xs text-muted-foreground">
                                {type.kind === "DAY"
                                  ? t("ticket.checkout.dayTicket")
                                  : t("ticket.checkout.packageTicket", { days: type.dayCount })}
                              </span>
                            </span>
                            <span className="shrink-0 font-extrabold text-primary">
                              {formatCurrency(type.price)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Bug 10/11: ảnh riêng của từng chi nhánh. */}
                  <ImageGallery images={photosOfBranch(b.id)} columns={3} className="mt-3" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* B-25: PT của gym */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Users className="size-5 text-primary" /> {t("marketplace.trainers")}</h2>
          {pts.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(pts.data?.content ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("marketplace.noTrainers")}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(pts.data?.content ?? []).map((pt) => (
                <Link key={pt.id} href={`/trainers/${pt.id}`} className="rounded-2xl border border-border p-4 transition-colors hover:border-primary/50">
                  <p className="font-bold text-foreground">{pt.displayName ?? t("marketplace.trainers")}</p>
                  {pt.specialization && <p className="text-[11px] font-semibold text-primary">{pt.specialization}</p>}
                  <div className="mt-1"><RatingStars rating={pt.averageRating} count={pt.reviewCount} /></div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{pt.bio}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* UC-009: đánh giá công khai của khách đã tập tại gym (chỉ hiển thị). */}
        <PublicReviews
          scope="gym"
          targetId={gymId}
          average={g.averageRating}
          count={g.reviewCount}
        />

        {/* Bug 10: nút đặt lịch ở cuối trang. */}
        <div className="mt-8">
          <Link
            href={bookingHref}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            <CalendarCheck className="size-5" /> {t("marketplace.bookAt", { name: g.gymName ?? "" })}
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}
