"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Clock,
  Info,
  MapPin,
  Package,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { marketplaceService } from "@/services/marketplace.service";
import { SiteLayout } from "@/modules/layout/site-layout";
import {
  usePublicPackages,
  type PackageSortValue,
  type PublicPackageItem,
} from "@/modules/package/hooks/use-public-packages";
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
  type PriceRangeValue,
} from "@/shared/constants/vn-locations";
import { useClientPagination } from "@/shared/hooks/use-client-pagination";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";

/**
 * Gói tập mỗi trang — client tự phân trang vì catalog được gộp ở FE
 * (xem usePublicPackages: BE chưa có endpoint list gói xuyên nhiều gym).
 * Bội của 6 để hàng cuối không lẻ ở cả lưới 2 cột lẫn 3 cột.
 */
const PAGE_SIZE_OPTIONS = [12, 24, 48];

/**
 * PRICE_RANGES mang label tiếng Việt cứng (dùng chung với trang Phòng gym).
 * Trang này dịch qua i18n nên map value -> key thay vì đọc `label`.
 */
const PRICE_LABEL_KEYS = {
  all: "marketplace.allPrices",
  under1m: "marketplace.priceUnder1m",
  m1to3: "marketplace.price1to3m",
  m3to10: "marketplace.price3to10m",
  over10: "marketplace.priceOver10m",
} as const satisfies Record<PriceRangeValue, string>;

const SORT_LABEL_KEYS = {
  default: "marketplace.sortDefault",
  priceAsc: "marketplace.sortPriceAsc",
  priceDesc: "marketplace.sortPriceDesc",
  mostSessions: "marketplace.sortMostSessions",
} as const satisfies Record<PackageSortValue, string>;

const SORT_VALUES = ["default", "priceAsc", "priceDesc", "mostSessions"] as const;

/** "{count} buổi · hạn {days} ngày" — cùng câu với trang quản lý gói của gym. */
function useSessionsSummary() {
  const t = useTranslations();
  return (pkg: PublicPackageItem["pkg"]) =>
    pkg.validityDays != null
      ? t("gym.packages.sessionsSummary", { count: pkg.sessionCount ?? 0, days: pkg.validityDays })
      : t("gym.packages.sessionsSummaryNoExpiry", { count: pkg.sessionCount ?? 0 });
}

/** Deep-link mở sẵn wizard tạo lịch với gym + gói đã chọn (đã có ở BookingWorkspacePage). */
function bookingHref(gymId: number, packageId: number) {
  return `/profile/bookings?create=1&gymId=${gymId}&packageId=${packageId}`;
}

function gymLocation(gym: PublicPackageItem["gym"]) {
  return [gym.district, gym.city].filter(Boolean).join(", ");
}

export function PackagesPublicPage() {
  const t = useTranslations();
  const sessionsSummary = useSessionsSummary();

  const [keyword, setKeyword] = useState("");
  // Cùng quy ước với trang Phòng gym: dropdown áp dụng ngay, chỉ từ khoá chờ submit.
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [city, setCity] = useState("all");
  const [district, setDistrict] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceRangeValue>("all");
  const [sort, setSort] = useState<PackageSortValue>("default");
  const resultsRef = useRef<HTMLElement>(null);

  const priceRange = useMemo(() => findPriceRange(priceFilter), [priceFilter]);
  const { items, isLoading, isError, error, totalGyms, scannedGyms, truncated } = usePublicPackages({
    keyword: appliedKeyword,
    city,
    district,
    priceRange,
    sort,
  });
  const { page, pageSize, totalPages, visible, setPage, setPageSize } =
    useClientPagination(items, PAGE_SIZE_OPTIONS[0]);

  // Đổi bộ lọc mà giữ nguyên số trang thì đang ở trang 5 với kết quả chỉ còn 2
  // trang sẽ ra màn hình trắng — luôn về trang đầu khi tập kết quả thay đổi.
  useEffect(() => {
    setPage(0);
  }, [appliedKeyword, city, district, priceFilter, sort, setPage]);

  /** Đổi trang thì cuộn về đầu danh sách thay vì đứng nguyên ở cuối lưới. */
  function goToPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
    setSort("default");
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-72">
            <form onSubmit={apply} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">{t("marketplace.filters")}</h2>
                <Button variant="link" size="inline" type="button" onClick={clearAll} className="text-primary">
                  {t("marketplace.resetFilters")}
                </Button>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("marketplace.keyword")}</p>
                <SearchInput
                  className="h-10"
                  placeholder={t("packages.searchPlaceholder")}
                  value={keyword}
                  onValueChange={setKeyword}
                />
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("common.table.city")}</p>
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
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("marketplace.district")}</p>
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
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("marketplace.priceRange")}</p>
                <Select value={priceFilter} onValueChange={(v) => setPriceFilter(v as PriceRangeValue)}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{t(PRICE_LABEL_KEYS[r.value])}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="mt-5 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="size-4" />{t("common.actions.apply")}</Button>
            </form>
          </aside>

          <section ref={resultsRef} className="min-w-0 flex-1 scroll-mt-4">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("packages.title")}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("packages.found", { count: items.length, gyms: scannedGyms })}
                </p>
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as PackageSortValue)}>
                <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>{t(SORT_LABEL_KEYS[value])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nói thẳng khi kết quả chưa đầy đủ thay vì lặng lẽ cắt bớt gói. */}
            {truncated && !isLoading && (
              <p className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-xs font-semibold text-warning">
                <Info className="mt-0.5 size-4 shrink-0" />
                {t("packages.partialScan", { scanned: scannedGyms, total: totalGyms })}
              </p>
            )}

            {isLoading ? (
              <LoadingSkeleton />
            ) : isError ? (
              <EmptyState title={t("packages.loadError")} description={toErrorMessage(error)} />
            ) : !items.length ? (
              <EmptyState title={t("packages.none")} description={t("packages.noneHint")} />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((item) => (
                    <article
                      key={item.key}
                      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-bold text-foreground">{item.pkg.name}</h2>
                        <Package className="mt-0.5 size-4 shrink-0 text-primary" />
                      </div>

                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
                        <Building2 className="size-3.5" />{item.gym.gymName}
                        {item.gym.verified && <BadgeCheck className="size-3.5 text-success" />}
                      </p>
                      {gymLocation(item.gym) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />{gymLocation(item.gym)}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-muted-foreground">{sessionsSummary(item.pkg)}</p>
                      {item.pkg.gymServiceName && (
                        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                          {t("marketplace.serviceLabel")} {item.pkg.gymServiceName}
                        </p>
                      )}
                      {item.pkg.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.pkg.description}</p>
                      )}

                      {/* Không render hàng rỗng: div trống vẫn ăn `mt-3` và làm lệch card. */}
                      {(item.pkg.bookingRules?.depositPercent != null
                        || (item.pkg.ptSurcharge != null && item.pkg.ptSurcharge > 0)) && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {item.pkg.bookingRules?.depositPercent != null && (
                            <Badge variant="info">
                              {t("marketplace.depositPercent", { percent: item.pkg.bookingRules.depositPercent })}
                            </Badge>
                          )}
                          {item.pkg.ptSurcharge != null && item.pkg.ptSurcharge > 0 && (
                            <Badge variant="outline">
                              {t("packages.ptSurchargeShort", { amount: formatCurrency(item.pkg.ptSurcharge) })}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* mt-auto: card cùng hàng cao bằng nhau (grid stretch) nên giá +
                          nút phải bị đẩy xuống đáy, nếu không mỗi card một cao độ. */}
                      <div className="mt-auto pt-3">
                        <div className="flex items-end justify-between border-t border-border pt-3">
                          <span className="text-lg font-extrabold text-primary">
                            {item.pkg.price != null ? formatCurrency(item.pkg.price) : "—"}
                          </span>
                          {item.pkg.sessionCount ? (
                            <span className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(Math.round((item.pkg.price ?? 0) / item.pkg.sessionCount))}
                              {t("gym.packages.perSession")}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Link
                            href={`/packages/${item.packageId}?gym=${item.gymId}`}
                            className="flex h-9 items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                          >{t("common.actions.viewDetail")}</Link>
                          <Link
                            href={bookingHref(item.gymId, item.packageId)}
                            className="flex h-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >{t("marketplace.book")}</Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <Pagination
                  className="mt-6"
                  page={page}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  zeroBased
                  totalItems={items.length}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  pageSizeLabel={t("common.pagination.itemsPerPage")}
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

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </SiteLayout>
  );
}

/**
 * Chi tiết một gói tập.
 *
 * Không có `GET /marketplace/packages/{id}` nên gói được định vị qua catalog của
 * gym — vì vậy route bắt buộc mang theo `?gym=`. Danh sách luôn sinh link kèm
 * tham số này; vào trực tiếp mà thiếu thì báo rõ thay vì quét toàn bộ gym.
 */
export function PackageDetailPage({ packageId, gymId }: { packageId: number; gymId?: number }) {
  const t = useTranslations();
  const sessionsSummary = useSessionsSummary();

  // Cùng queryKey với trang chi tiết gym & booking wizard -> dùng lại cache sẵn có.
  const gym = useQuery({
    queryKey: ["marketplace", "gym", gymId],
    queryFn: () => marketplaceService.getGym(gymId!),
    enabled: gymId != null,
  });
  const packages = useQuery({
    queryKey: ["marketplace", "gym", gymId, "packages"],
    queryFn: () => marketplaceService.getGymPackages(gymId!),
    enabled: gymId != null,
  });

  const backLink = (
    <Link
      href="/packages"
      className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
    >
      <ArrowLeft className="size-4" /> {t("marketplace.backToList")}
    </Link>
  );

  if (gymId == null) {
    return (
      <DetailShell>
        {backLink}
        <EmptyState title={t("packages.missingGym")} description={t("packages.missingGymHint")} />
      </DetailShell>
    );
  }

  if (gym.isLoading || packages.isLoading) {
    return <DetailShell>{backLink}<LoadingSkeleton /></DetailShell>;
  }

  if (gym.isError || packages.isError) {
    return (
      <DetailShell>
        {backLink}
        <EmptyState
          title={t("packages.loadError")}
          description={toErrorMessage(gym.error ?? packages.error)}
        />
      </DetailShell>
    );
  }

  const pkg = (packages.data ?? []).find((p) => p.id === packageId);
  if (!pkg || !gym.data) {
    return (
      <DetailShell>
        {backLink}
        <EmptyState title={t("packages.notFound")} description={t("packages.notFoundHint")} />
      </DetailShell>
    );
  }

  const g = gym.data;
  const rules = pkg.bookingRules;
  const hasRules =
    rules?.depositPercent != null
    || rules?.freeCancellationHours != null
    || rules?.minNoticeHours != null;

  return (
    <DetailShell>
      {backLink}

      <section className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
              <Package className="size-3.5" /> {t("marketplace.packages")}
            </span>
            <h1 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">{pkg.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <Link href={`/gyms/${gymId}`} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                <Building2 className="size-4" />{g.gymName}
              </Link>
              {g.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                  <BadgeCheck className="size-3.5" /> {t("marketplace.verified")}
                </span>
              )}
            </p>
            {[g.address, g.district, g.city].filter(Boolean).length > 0 && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />{[g.address, g.district, g.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-3xl font-black text-primary">
              {pkg.price != null ? formatCurrency(pkg.price) : "—"}
            </p>
            {pkg.sessionCount ? (
              <p className="mt-1 text-xs text-muted-foreground">
                ≈ {formatCurrency(Math.round((pkg.price ?? 0) / pkg.sessionCount))}
                {t("gym.packages.perSession")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={bookingHref(gymId, packageId)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CalendarCheck className="size-4" /> {t("packages.book")}
          </Link>
          <Link
            href={`/gyms/${gymId}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Building2 className="size-4" /> {t("marketplace.viewGymOf")}
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Sparkles className="size-5 text-primary" /> {t("packages.overview")}
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">{t("gym.packages.sessionsLabel")}</dt>
            <dd className="mt-0.5 text-sm font-bold text-foreground">{sessionsSummary(pkg)}</dd>
          </div>
          {pkg.gymServiceName && (
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">{t("marketplace.services")}</dt>
              <dd className="mt-0.5 text-sm font-bold text-foreground">{pkg.gymServiceName}</dd>
            </div>
          )}
          {pkg.ptSurcharge != null && pkg.ptSurcharge > 0 && (
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Wallet className="size-3.5" />{t("packages.ptSurcharge")}
              </dt>
              <dd className="mt-0.5 text-sm font-bold text-foreground">{formatCurrency(pkg.ptSurcharge)}</dd>
            </div>
          )}
        </dl>
        {pkg.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{pkg.description}</p>
        )}
      </section>

      {pkg.usageConditions && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Info className="size-5 text-primary" /> {t("gym.packages.termsLabel")}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{pkg.usageConditions}</p>
        </section>
      )}

      <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Clock className="size-5 text-primary" /> {t("packages.rules")}
        </h2>
        {hasRules ? (
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {rules?.depositPercent != null && (
              <li>· {t("marketplace.depositPercent", { percent: rules.depositPercent })}</li>
            )}
            {rules?.freeCancellationHours != null && (
              <li>· {t("packages.freeCancellation", { hours: rules.freeCancellationHours })}</li>
            )}
            {rules?.minNoticeHours != null && (
              <li>· {t("packages.minNotice", { hours: rules.minNoticeHours })}</li>
            )}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("packages.defaultRules")}</p>
        )}
      </section>
    </DetailShell>
  );
}
