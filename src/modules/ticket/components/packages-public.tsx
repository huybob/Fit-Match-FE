"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Building2, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { SiteLayout } from "@/modules/layout/site-layout";
import { ticketService } from "@/services/ticket.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchInput } from "@/shared/components/ui/search-input";
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
import { formatCurrency } from "@/utils/format.util";
import type { MarketplaceTicketType } from "@/types/Ticket";

/** Bội của 6 để hàng cuối không lẻ ở cả lưới 2 lẫn 3 cột. */
const PAGE_SIZE_OPTIONS = [12, 24, 48];

/** PRICE_RANGES mang label tiếng Việt cứng — trang này dịch nên map sang khoá. */
const PRICE_LABEL_KEYS = {
  all: "marketplace.allPrices",
  under1m: "marketplace.priceUnder1m",
  m1to3: "marketplace.price1to3m",
  m3to10: "marketplace.price3to10m",
  over10: "marketplace.priceOver10m",
} as const satisfies Record<PriceRangeValue, string>;

const SORT_OPTIONS = [
  { value: "id,desc", labelKey: "marketplace.sortDefault" },
  { value: "price,asc", labelKey: "marketplace.sortPriceAsc" },
  { value: "price,desc", labelKey: "marketplace.sortPriceDesc" },
  { value: "dayCount,desc", labelKey: "packages.sortMostDays" },
] as const;

/**
 * Trang "Gói tập" — duyệt VÉ GÓI đang bán trên toàn sàn.
 *
 * Trong mô hình vé, "gói tập" chính là vé `kind=PACKAGE`: mua một lần, dùng
 * `dayCount` ngày liên tiếp. Trang giữ nguyên vai trò cũ (khách duyệt và so
 * sánh gói trước khi chọn phòng gym), chỉ đổi nguồn dữ liệu.
 *
 * Lọc/sắp xếp/phân trang chạy ở BE trên TOÀN tập. Bản cũ gộp ở client bằng cách
 * quét 100 gym đầu tiên rồi gọi catalog từng gym, nên kết quả luôn là một phần
 * sàn và trang phải hiện cảnh báo "mới quét N gym" — nay không còn.
 */
export function PackagesPublicPage() {
  const t = useTranslations();

  const [keyword, setKeyword] = useState("");
  // Cùng quy ước trang Phòng gym: dropdown áp dụng ngay, chỉ từ khoá chờ submit.
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [city, setCity] = useState("all");
  const [district, setDistrict] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceRangeValue>("all");
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const resultsRef = useRef<HTMLElement>(null);

  const priceRange = useMemo(() => findPriceRange(priceFilter), [priceFilter]);

  /*
   * Bộ lọc mới thì tập kết quả mới — trang 5 cũ không còn nghĩa. Chỉnh ngay
   * trong render và TRƯỚC useQuery; làm ở effect thì React đã kịp bắn request
   * cho cặp "bộ lọc mới + trang cũ" rồi mới bắn tiếp request trang đầu.
   */
  const filterKey = JSON.stringify([appliedKeyword, city, district, priceFilter, sort, pageSize]);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const query = useQuery({
    queryKey: ["marketplace", "package-tickets", filterKey, page],
    queryFn: () =>
      ticketService.searchTicketTypes({
        kind: "PACKAGE",
        keyword: appliedKeyword || undefined,
        city: city === "all" ? undefined : city,
        district: district === "all" ? undefined : district,
        minPrice: minPriceParam(priceRange),
        maxPrice: maxPriceParam(priceRange),
        page,
        size: pageSize,
        sort,
      }),
    // Không thay lưới bằng skeleton mỗi lần sang trang.
    placeholderData: keepPreviousData,
  });

  const items = query.data?.content ?? [];
  const total = query.data?.totalElements ?? 0;
  const totalPages = query.data?.totalPages ?? 1;
  const districts = VN_CITIES.find((c) => c.name === city)?.districts ?? [];

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setAppliedKeyword(keyword);
  }

  function clearAll() {
    setKeyword("");
    setAppliedKeyword("");
    setCity("all");
    setDistrict("all");
    setPriceFilter("all");
    setSort(SORT_OPTIONS[0].value);
  }

  function goToPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-72">
            <form onSubmit={apply} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">{t("marketplace.filters")}</h2>
                <Button
                  variant="link"
                  size="inline"
                  type="button"
                  onClick={clearAll}
                  className="text-primary"
                >
                  {t("marketplace.resetFilters")}
                </Button>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  {t("marketplace.keyword")}
                </p>
                <SearchInput
                  className="h-10"
                  placeholder={t("packages.searchPlaceholder")}
                  value={keyword}
                  onValueChange={setKeyword}
                />
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  {t("common.table.city")}
                </p>
                <Select
                  value={city}
                  onValueChange={(v) => {
                    setCity(v);
                    setDistrict("all");
                  }}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("marketplace.allCities")}</SelectItem>
                    {VN_CITIES.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  {t("marketplace.district")}
                </p>
                <Select value={district} onValueChange={setDistrict} disabled={city === "all"}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={city === "all" ? t("marketplace.pickCityFirst") : undefined}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("marketplace.allDistricts")}</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  {t("marketplace.priceRange")}
                </p>
                <Select
                  value={priceFilter}
                  onValueChange={(v) => setPriceFilter(v as PriceRangeValue)}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {t(PRICE_LABEL_KEYS[r.value])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Lọc theo giá NIÊM YẾT; chọn PT sẽ cộng thêm phụ phí. */}
                <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                  {t("packages.priceFilterHint")}
                </p>
              </div>

              <Button type="submit" className="mt-4 h-10 w-full">
                {t("marketplace.applyFilters")}
              </Button>
            </form>
          </aside>

          <section ref={resultsRef} className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-foreground">{t("packages.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("packages.found", { count: total })}
                </p>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {t(o.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState
                title={t("packages.loadError")}
                description={toErrorMessage(query.error)}
              />
            ) : !items.length ? (
              <EmptyState title={t("packages.none")} description={t("packages.noneHint")} />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <PackageCard key={item.id} item={item} />
                  ))}
                </div>
                <Pagination
                  className="mt-6"
                  zeroBased
                  page={page}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  pageSizeLabel={t("common.pagination.itemsPerPage")}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

function PackageCard({ item }: { item: MarketplaceTicketType }) {
  const t = useTranslations();
  // Mua vé BẮT BUỘC kèm branchId. Vé không gắn chi nhánh nào thì không mua được
  // — hiện rõ thay vì dẫn tới checkout rồi mới báo lỗi.
  const branch = item.branches[0];
  const perDay = Math.round(item.price / Math.max(item.dayCount, 1));

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold leading-6 text-foreground">{item.name}</h2>
        <Badge variant="outline" className="shrink-0 gap-1">
          <CalendarDays className="size-3" />
          {t("packages.dayCount", { count: item.dayCount })}
        </Badge>
      </div>

      <Link
        href={`/gyms/${item.gymId}`}
        className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <Building2 className="size-3.5 shrink-0" />
        <span className="truncate">{item.gymName}</span>
      </Link>

      {(item.gymDistrict || item.gymCity) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {[item.gymDistrict, item.gymCity].filter(Boolean).join(", ")}
          </span>
        </p>
      )}

      {item.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xl font-black text-foreground">{formatCurrency(item.price)}</p>
        <p className="text-xs text-muted-foreground">
          {t("packages.perDay", { price: formatCurrency(perDay) })}
        </p>
        {!!item.ptSurchargePerDay && (
          <p className="mt-1 flex items-center gap-1 text-xs text-primary">
            <Sparkles className="size-3.5 shrink-0" />
            {t("packages.withPt", { price: formatCurrency(item.priceWithPt) })}
          </p>
        )}
      </div>

      {branch ? (
        <Button asChild className="mt-4 h-10 w-full">
          <Link href={`/checkout?branchId=${branch.id}&ticketTypeId=${item.id}`}>
            {t("packages.book")}
          </Link>
        </Button>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">{t("packages.noBranch")}</p>
      )}
    </article>
  );
}
