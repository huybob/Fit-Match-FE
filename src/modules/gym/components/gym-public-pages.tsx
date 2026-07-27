"use client";

import Link from "next/link";
import { Building2, MapPin, Phone, Search, ArrowLeft, BadgeCheck, Clock, Dumbbell, Sparkles, Package, GitBranch, Users, Heart, CalendarCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketplaceService, type GymSearchParams } from "@/services/marketplace.service";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ReportIssueButton } from "@/modules/report/report-issue-button";
import { SiteLayout } from "@/modules/layout/site-layout";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { RatingStars } from "@/shared/components/common/rating-stars";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { PRICE_RANGES, VN_CITIES, type PriceRangeValue } from "@/shared/constants/vn-locations";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";
import { useTranslations } from "next-intl";
import { weekdayShortKey } from "@/shared/utils/enum-label.util";
import { SearchInput } from "@/shared/components/ui/search-input";
import { IconButton } from "@/shared/components/ui/icon-button";

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

export function GymsPublicPage() {
  const t = useTranslations();
  const [keyword, setKeyword] = useState("");
  // Bug 11: vị trí lọc theo thành phố + quận (dropdown) thay vì ô text tự do.
  const [city, setCity] = useState("all");
  const [district, setDistrict] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceRangeValue>("all");
  const [params, setParams] = useState<GymSearchParams>({});
  // UC-008: sắp xếp kết quả — sort theo field entity (BE Spring Pageable).
  const [sort, setSort] = useState("createdAt,desc");
  const query = useQuery({
    queryKey: ["marketplace", "gyms", params, sort],
    queryFn: () => marketplaceService.searchGyms({ ...params, sort }),
  });

  const districts = VN_CITIES.find((c) => c.name === city)?.districts ?? [];

  function apply(event?: FormEvent) {
    event?.preventDefault();
    const range = PRICE_RANGES.find((r) => r.value === priceFilter);
    setParams({
      keyword: keyword || undefined,
      city: city !== "all" ? city : undefined,
      district: district !== "all" ? district : undefined,
      minPrice: range && "min" in range && range.min ? range.min : undefined,
      maxPrice: range && "max" in range ? range.max : undefined,
    });
  }
  function clearAll() {
    setKeyword(""); setCity("all"); setDistrict("all"); setPriceFilter("all"); setParams({});
  }

  const items = query.data?.content ?? [];
  const total = query.data?.totalElements ?? items.length;

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
          <section className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("marketplace.gymsNearYou")}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{params.city
              ? t("marketplace.foundGymsNear", { count: total, city: params.city })
              : t("marketplace.foundGyms", { count: total })}</p>
              </div>
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
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title={t("marketplace.gymLoadError")} description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((gym) => (
                  <article key={gym.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {/* A-19: gỡ badge t("marketplace.openNow") hardcode — giờ mở cửa thật ở trang chi tiết */}
                    {/* Bug 11: ảnh thật của gym nếu có media, fallback gradient. */}
                    {gym.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={gym.coverUrl} alt={gym.gymName ?? t("marketplace.gym")} className="h-36 w-full object-cover" />
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
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{gym.description || t("marketplace.noDescription")}</p>
                      <div className="mt-4 flex items-center justify-between">
                        {gym.id != null ? <GymFavoriteButton gymId={gym.id} /> : <span />}
                        <Link
                          href={`/gyms/${gym.id}`}
                          className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
                        >{t("common.actions.viewDetail")}</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
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
  const services = useQuery({
    queryKey: ["marketplace", "gym", gymId, "services"],
    queryFn: () => marketplaceService.getGymServices(gymId),
    enabled: !!gym.data,
  });
  const packages = useQuery({
    queryKey: ["marketplace", "gym", gymId, "packages"],
    queryFn: () => marketplaceService.getGymPackages(gymId),
    enabled: !!gym.data,
  });
  const branches = useQuery({
    queryKey: ["marketplace", "gym", gymId, "branches"],
    queryFn: () => marketplaceService.getGymBranches(gymId),
    enabled: !!gym.data,
  });
  const pts = useQuery({
    queryKey: ["marketplace", "gym", gymId, "pts"],
    queryFn: () => marketplaceService.getGymPts(gymId),
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
  // Bug 10: khoảng giá từ catalog đang bán (dịch vụ buổi lẻ + gói tập).
  const prices = [
    ...(services.data ?? []).map((s) => s.price),
    ...(packages.data ?? []).map((p) => p.price),
  ].filter((p): p is number => p != null && p > 0);
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
  const gymPhotos = (media.data ?? []).filter((m) => m.branchId == null && m.url);
  const photosOfBranch = (branchId?: number) =>
    (media.data ?? []).filter((m) => m.url && m.branchId != null && m.branchId === branchId);
  const bookingHref = `/profile/bookings?create=1&gymId=${gymId}`;
  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/gyms" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> {t("marketplace.backToList")}
        </Link>

        {/* Hero cover */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative h-48 bg-gradient-to-br from-primary via-primary to-primary sm:h-56">
            <div className="absolute inset-0 grid place-items-center opacity-20"><Building2 className="size-28 text-success-foreground" /></div>
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

        {/* Bug 10/11: ảnh của phòng gym (media công khai). */}
        {!!gymPhotos.length && (
          <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Sparkles className="size-5 text-primary" /> {t("marketplace.photos")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gymPhotos.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={m.id} src={m.url} alt={m.caption || t("marketplace.gymPhoto")} className="h-32 w-full rounded-xl object-cover" />
              ))}
            </div>
          </section>
        )}

        {/* B-25: Dịch vụ đang bán */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Sparkles className="size-5 text-primary" /> {t("marketplace.services")}</h2>
          {services.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(services.data ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("marketplace.noServices")}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(services.data ?? []).map((s) => (
                <div key={s.id} className="rounded-2xl border border-border p-4">
                  <p className="font-bold text-foreground">{s.name}</p>
                  {s.categoryName && <p className="text-[11px] font-semibold text-primary">{s.categoryName}</p>}
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-extrabold text-primary">{s.price != null ? formatCurrency(s.price) : "—"}</span>
                    {s.durationMinutes != null && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> {s.durationMinutes}′</span>
                    )}
                  </div>
                  {s.bookingRules?.depositPercent != null && (
                    <p className="mt-1 text-[11px] text-muted-foreground">{t("marketplace.depositPercent", { percent: s.bookingRules.depositPercent })}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* B-25: {t("marketplace.packages")} */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Package className="size-5 text-primary" /> {t("marketplace.packages")}</h2>
          {packages.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(packages.data ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("marketplace.noPackages")}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(packages.data ?? []).map((p) => (
                <div key={p.id} className="rounded-2xl border border-border p-4">
                  <p className="font-bold text-foreground">{p.name}</p>
                  {p.gymServiceName && <p className="text-[11px] font-semibold text-primary">{t("marketplace.services")}: {p.gymServiceName}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.validityDays != null
                      ? t("gym.packages.sessionsSummary", { count: p.sessionCount ?? 0, days: p.validityDays })
                      : t("gym.packages.sessionsSummaryNoExpiry", { count: p.sessionCount ?? 0 })}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-extrabold text-primary">{p.price != null ? formatCurrency(p.price) : "—"}</span>
                    {p.sessionCount ? (
                      <span className="text-xs text-muted-foreground">≈ {formatCurrency(Math.round((p.price ?? 0) / p.sessionCount))}{t("gym.packages.perSession")}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                  {/* Bug 10/11: ảnh riêng của từng chi nhánh. */}
                  {!!photosOfBranch(b.id).length && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {photosOfBranch(b.id).map((m) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={m.id} src={m.url} alt={m.caption || b.name || t("marketplace.branchPhoto")} className="h-20 w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
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
