"use client";

import Link from "next/link";
import { Award, Search, UserRound, MapPin, Heart, ShieldCheck, ArrowLeft, Briefcase, Building2, CalendarCheck, CalendarDays, ExternalLink, BadgeCheck } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportIssueButton } from "@/modules/report/report-issue-button";
import { SiteLayout } from "@/modules/layout/site-layout";
import { marketplaceService, type PtPublicProfile } from "@/services/marketplace.service";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Pagination } from "@/shared/components/ui/pagination";
import { RatingStars } from "@/shared/components/common/rating-stars";
import {
  ResultCard,
  ResultCardExcerpt,
  ResultCardMeta,
} from "@/shared/components/common/result-card";
import { PublicReviews } from "@/modules/review/components/public-reviews";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import { CheckboxField } from "@/shared/components/ui/checkbox-field";
import { useTranslations } from "next-intl";
import { initialsOf, UserAvatar } from "@/shared/components/common/user-avatar";
import { SearchInput } from "@/shared/components/ui/search-input";

function useFavorites() {
  const { user, status } = useAuthStore();
  const isCustomer = status === "authenticated" && user?.role === "ROLE_CUSTOMER";
  const qc = useQueryClient();
  const favQuery = useQuery({
    queryKey: ["favorites", "pts"],
    queryFn: favoritesService.list,
    enabled: isCustomer,
  });
  const ids = new Set((favQuery.data ?? []).map((p) => p.id));
  const toggle = useMutation({
    mutationFn: ({ id, fav }: { id: number; fav: boolean }) =>
      fav ? favoritesService.remove(id) : favoritesService.add(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", "pts"] }),
  });
  return { isCustomer, ids, toggle };
}

/**
 * `value` là giá trị gửi lên API (query `specialization`) nên PHẢI giữ nguyên
 * chuỗi cũ — chỉ phần nhãn hiển thị được dịch.
 */
const SPECIALIZATIONS = [
  { value: "Thể hình (Bodybuilding)", labelKey: "marketplace.spec.bodybuilding" },
  { value: "Giảm cân", labelKey: "marketplace.spec.weightLoss" },
  { value: "HIIT", labelKey: null },
  { value: "Yoga & Linh hoạt", labelKey: "marketplace.spec.yoga" },
  { value: "Sức mạnh & Thể lực", labelKey: "marketplace.spec.strength" },
  { value: "Phục hồi", labelKey: "marketplace.spec.rehab" },
] as const;

/** Cùng bậc với trang Phòng gym: bội của 6 để hàng cuối không lẻ ở 2 hay 3 cột. */
const PAGE_SIZE_OPTIONS = [12, 24, 48];

export function TrainersDirectoryPage() {
  const t = useTranslations();
  const [keyword, setKeyword] = useState("");
  /**
   * Sheet1#17: danh sách chuyên môn hiển thị bằng CHECKBOX (ngụ ý chọn nhiều)
   * nhưng state trước đây là một chuỗi đơn, nên tick ô này lại bỏ ô kia — người
   * dùng thấy "filter chỉ chọn được 1". Giữ nguyên giao diện, đổi state sang mảng.
   */
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState("");
  const [params, setParams] = useState<{ keyword?: string; specialization?: string[]; serviceArea?: string }>({});
  // UC-008: sắp xếp kết quả — sort theo field entity (BE Spring Pageable).
  const [sort, setSort] = useState("createdAt,desc");
  // Phân trang server-side: `GET /marketplace/pts` nhận page/size/sort (Pageable).
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const resultsRef = useRef<HTMLElement>(null);

  /**
   * Bộ lọc mới thì tập kết quả mới — trang 5 cũ không còn ý nghĩa. Điều chỉnh ngay
   * trong lúc render và TRƯỚC `useQuery`; làm ở effect thì React đã kịp bắn request
   * cho cặp "bộ lọc mới + trang cũ" rồi mới bắn tiếp request trang đầu.
   */
  const filterKey = JSON.stringify([params, sort, pageSize]);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const query = useQuery({
    queryKey: ["marketplace", "pts", params, sort, page, pageSize],
    queryFn: () => marketplaceService.searchPts({ ...params, sort, page, size: pageSize }),
    // Không thay lưới bằng skeleton mỗi lần sang trang.
    placeholderData: keepPreviousData,
  });
  const { isCustomer, ids, toggle } = useFavorites();

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setParams({
      keyword: keyword || undefined,
      specialization: specializations.length ? specializations : undefined,
      serviceArea: serviceArea || undefined,
    });
  }
  function clearAll() {
    setKeyword(""); setSpecializations([]); setServiceArea(""); setParams({});
  }

  const items = query.data?.content ?? [];
  const total = query.data?.totalElements ?? items.length;
  const totalPages = query.data?.totalPages ?? 1;

  /** Đổi trang thì đưa người dùng về đầu danh sách, không để lơ lửng ở cuối lưới. */
  function goToPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filter sidebar */}
          <aside className="w-full shrink-0 lg:w-72">
            <form onSubmit={apply} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">{t("marketplace.filters")}</h2>
                <Button variant="link" size="inline" type="button" onClick={clearAll} className="text-primary">{t("marketplace.clearAll")}</Button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("marketplace.keyword")}</p>
                <SearchInput
                    className="h-10"
                    placeholder={t("marketplace.searchTrainerPlaceholder")}
                    value={keyword}
                    onValueChange={setKeyword}
                  />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{t("marketplace.specialisation")}</p>
                <div className="space-y-1.5">
                  {SPECIALIZATIONS.map((spec) => (
                    <CheckboxField
                      key={spec.value}
                      checked={specializations.includes(spec.value)}
                      onCheckedChange={(checked) =>
                        setSpecializations((prev) =>
                          checked ? [...prev, spec.value] : prev.filter((v) => v !== spec.value),
                        )
                      }
                      label={spec.labelKey ? t(spec.labelKey) : spec.value}
                      labelClassName="font-medium"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("marketplace.location")}</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-10" placeholder={t("marketplace.locationPlaceholder")} value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="mt-5 w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Search className="size-4" />{t("common.actions.apply")}</Button>
            </form>
          </aside>

          {/* Results */}
          <section ref={resultsRef} className="min-w-0 flex-1 scroll-mt-4">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("marketplace.trainersTitle")}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{t("marketplace.trainersSubtitle", { count: total })}</p>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt,desc">{t("marketplace.sortNewest")}</SelectItem>
                  {/* UC-008 (V51): sort theo cột denorm avg_rating */}
                  <SelectItem value="avgRating,desc">{t("marketplace.sortTopRated")}</SelectItem>
                  <SelectItem value="displayName,asc">{t("marketplace.sortNameAsc")}</SelectItem>
                  <SelectItem value="experienceYears,desc">{t("marketplace.sortMostExperience")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title={t("marketplace.listLoadError")} description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <>
              {/* Mờ đi trong lúc tải trang kế — dữ liệu cũ vẫn đọc được. */}
              <div
                className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
                  query.isFetching ? "opacity-60 transition-opacity" : ""
                }`}
              >
                {items.map((pt) => (
                  <TrainerCard
                    key={pt.id}
                    pt={pt}
                    favorite={pt.id != null && ids.has(pt.id)}
                    canFavorite={isCustomer}
                    favoriteBusy={toggle.isPending}
                    onToggleFavorite={() =>
                      pt.id != null && toggle.mutate({ id: pt.id, fav: ids.has(pt.id) })
                    }
                  />
                ))}
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
              <EmptyState title={t("marketplace.noTrainerFound")} description={t("marketplace.noTrainerFoundHint")} />
            )}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

/**
 * Card HLV trong lưới kết quả. Dùng CHUNG vỏ `ResultCard` với card gói tập nên
 * hai trang có cùng bố cục, cùng cỡ chữ và — quan trọng nhất — nút hành động của
 * mọi card nằm sát đáy, không nhảy lên nhảy xuống theo độ dài mô tả.
 */
function TrainerCard({
  pt,
  favorite,
  canFavorite,
  favoriteBusy,
  onToggleFavorite,
}: {
  pt: PtPublicProfile;
  favorite: boolean;
  canFavorite: boolean;
  favoriteBusy: boolean;
  onToggleFavorite: () => void;
}) {
  const t = useTranslations();

  return (
    <ResultCard
      media={
        <div className="relative grid h-40 place-items-center bg-gradient-to-br from-primary to-primary text-primary-foreground">
          <UserRound className="size-14 opacity-90" />
          {/* Bug 14: badge data-driven — chỉ hiện khi PT thật sự được xác thực. */}
          {pt.verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success-foreground">
              <ShieldCheck className="size-3" /> {t("marketplace.verifiedShort")}
            </span>
          )}
          {canFavorite && pt.id != null && (
            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={favoriteBusy}
              aria-label={t("marketplace.favorite")}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Heart className={`size-4 ${favorite ? "fill-destructive text-destructive" : ""}`} />
            </button>
          )}
        </div>
      }
      footer={
        <Button asChild className="h-10 w-full">
          <Link href={`/trainers/${pt.id}`}>{t("common.actions.viewDetail")}</Link>
        </Button>
      }
    >
      <div>
        <h2 className="truncate text-base font-bold text-foreground">{pt.displayName}</h2>
        {/* Chuyên môn có thể trống — giữ sẵn một dòng để các card thẳng nhau. */}
        <p className="min-h-4 truncate text-xs font-semibold text-primary">
          {pt.specialization ?? ""}
        </p>
      </div>

      {/* UC-071: sao đánh giá ngay trên card (bug 5). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <RatingStars rating={pt.averageRating} count={pt.reviewCount} />
        <span className="text-[11px] text-muted-foreground">
          {t("marketplace.yearsExperience", { years: pt.experienceYears ?? 0 })}
        </span>
      </div>

      <ResultCardExcerpt>{pt.bio || t("marketplace.noDescription")}</ResultCardExcerpt>

      <ResultCardMeta icon={<MapPin />}>{pt.serviceArea || "—"}</ResultCardMeta>

      {/* Bug 3: điều hướng nhanh sang phòng gym quản lý PT. Không có gym thì vẫn
          giữ chiều cao dòng, nếu không nút bên dưới của card này sẽ lệch. */}
      {pt.gymId != null ? (
        <Link
          href={`/gyms/${pt.gymId}`}
          className="flex min-h-4 items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <Building2 className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">{pt.gymName || t("marketplace.viewGymOf")}</span>
        </Link>
      ) : (
        <p className="min-h-4" />
      )}
    </ResultCard>
  );
}

// Mục "thời gian biểu tuần" của PT đã gỡ: câu 26 bỏ lịch lặp theo thứ, PT khai
// theo NGÀY cụ thể. Lưới ngày x giờ cần branchId và phải đăng nhập, mà trang
// công khai này không có ngữ cảnh chi nhánh — nên lịch rảnh hiển thị ở bước xếp
// lịch (/schedule), nơi khách đã chọn chi nhánh.

export function TrainerPublicDetailPage({ userId }: { userId: number }) {
  const t = useTranslations();
  const query = useQuery({
    queryKey: ["marketplace", "pt", userId],
    queryFn: () => marketplaceService.getPt(userId),
  });
  const { isCustomer, ids, toggle } = useFavorites();

  if (query.isLoading)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-6xl px-4 py-12"><LoadingSkeleton /></main>
      </SiteLayout>
    );
  if (query.isError || !query.data)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-4xl px-4 py-12">
          <EmptyState title={t("marketplace.noTrainerFound")} description={toErrorMessage(query.error)} />
        </main>
      </SiteLayout>
    );

  const pt = query.data;
  const certCount = pt.certifications?.length ?? 0;
  const fav = pt.id != null && ids.has(pt.id);

  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/trainers" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> {t("marketplace.backToList")}
        </Link>

        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary p-6 text-primary-foreground shadow-xl shadow-primary/10 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              className="size-24 rounded-2xl ring-1 ring-white/20"
              name={pt.displayName ?? "PT"}
              fallback={
                initialsOf(pt.displayName) === "?" ? <UserRound className="size-10" /> : undefined
              }
              fallbackClassName="rounded-2xl bg-card/15 text-3xl font-black"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black">{pt.displayName}</h1>
                {/* Bug 14: tick xác thực data-driven. */}
                {pt.verified && <BadgeCheck className="size-6 text-primary-foreground/80" />}
              </div>
              {pt.specialization && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card/15 px-3 py-1 text-sm font-bold">
                  <Briefcase className="size-3.5" /> {pt.specialization}
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-primary-foreground/80">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> {t("marketplace.yearsExperience", { years: pt.experienceYears ?? 0 })}</span>
                {pt.serviceArea && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {pt.serviceArea}</span>}
                <span className="inline-flex items-center gap-1.5"><Award className="size-4" /> {t("marketplace.certsCount", { count: certCount })}</span>
                {pt.gymId != null && (
                  <Link href={`/gyms/${pt.gymId}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
                    <Building2 className="size-4" /> {pt.gymName || t("marketplace.gym")}
                  </Link>
                )}
              </div>
            </div>
            {isCustomer && pt.id != null && (
              <button
                onClick={() => toggle.mutate({ id: pt.id!, fav })}
                disabled={toggle.isPending}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <Heart className={`size-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
                {fav ? t("marketplace.favorited") : t("marketplace.favorite")}
              </button>
            )}
          </div>
        </section>

        {/* Stats strip */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { icon: CalendarDays, label: t("marketplace.experience"), value: t("marketplace.yearsValue", { years: pt.experienceYears ?? 0 }) },
            { icon: MapPin, label: t("marketplace.area"), value: pt.serviceArea || "—" },
            { icon: Award, label: t("marketplace.certs"), value: `${certCount}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <s.icon className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="mt-1.5 truncate text-lg font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* About */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-foreground">{t("marketplace.about")}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{pt.bio || t("marketplace.noAboutTrainer")}</p>

            <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-foreground"><Award className="size-5 text-primary" /> {t("marketplace.certsAndDiplomas")}</h2>
            {certCount ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pt.certifications!.map((cert) => (
                  <article key={cert.id} className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="size-4.5" /></div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground">{cert.name}</h3>
                        {cert.issuingOrganization && <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cert.issueDate ? t("marketplace.issuedOn", { date: cert.issueDate }) : ""}{cert.expiryDate ? ` · HH: ${cert.expiryDate}` : ""}
                        </p>
                        {cert.credentialUrl && (
                          <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            <ExternalLink className="size-3" /> {t("marketplace.viewCert")}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t("marketplace.noPublishedCerts")}</p>
            )}
          </section>


          {/* Summary / contact card */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground">{t("marketplace.quickInfo")}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("marketplace.specialisation")}</dt><dd className="font-semibold text-foreground">{pt.specialization || "—"}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("marketplace.experience")}</dt><dd className="font-semibold text-foreground">{t("marketplace.yearsValue", { years: pt.experienceYears ?? 0 })}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("marketplace.area")}</dt><dd className="font-semibold text-foreground">{pt.serviceArea || "—"}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("marketplace.rating")}</dt><dd><RatingStars rating={pt.averageRating} count={pt.reviewCount} /></dd></div>
                {pt.gymId != null && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">{t("marketplace.gym")}</dt>
                    <dd>
                      <Link href={`/gyms/${pt.gymId}`} className="font-semibold text-primary hover:underline">
                        {pt.gymName || t("marketplace.viewGymOf")}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
              {/* Không còn "đặt lịch thẳng với PT": trong mô hình vé, khách mua vé
                  của phòng gym trước rồi mới chọn PT ở bước xếp lịch. Nút này đưa
                  sang trang gym để mua vé có PT. Chỉ khách hàng mới mua được. */}
              {isCustomer && pt.id != null && pt.gymId != null && (
                <Link
                  href={`/gyms/${pt.gymId}`}
                  className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <CalendarCheck className="size-4" /> {t("marketplace.bookWithTrainer")}
                </Link>
              )}
              {/* Bug 3: nút điều hướng sang phòng gym để đăng ký PT thuận tiện. */}
              {pt.gymId != null && (
                <Link
                  href={`/gyms/${pt.gymId}`}
                  className="mt-2 flex items-center justify-center gap-2 h-9 rounded-lg border border-primary text-primary hover:bg-primary/5 text-sm font-semibold transition-colors"
                >
                  <Building2 className="size-4" /> {t("marketplace.viewTrainerGym")}
                </Link>
              )}
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
              <p className="text-sm font-semibold text-foreground">{t("marketplace.interestedTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("marketplace.interestedBody")}</p>
              {isCustomer && pt.id != null && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => toggle.mutate({ id: pt.id!, fav })}
                  disabled={toggle.isPending}
                >
                  <Heart className={`size-4 ${fav ? "fill-white" : ""}`} /> {fav ? t("common.actions.favoriteRemove") : t("marketplace.favoriteAddShort")}
                </Button>
              )}
              {/* UC-070: báo cáo vấn đề hành vi/chất lượng của PT */}
              {pt.id != null && (
                <div className="mt-2">
                  <ReportIssueButton targetType="PT" targetId={pt.id} targetName={pt.displayName} />
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* UC-009: đánh giá công khai từ khách đã đặt buổi tập với PT này. */}
        {pt.id != null && (
          <PublicReviews
            scope="pt"
            targetId={pt.id}
            average={pt.averageRating}
            count={pt.reviewCount}
          />
        )}
      </main>
    </SiteLayout>
  );
}
