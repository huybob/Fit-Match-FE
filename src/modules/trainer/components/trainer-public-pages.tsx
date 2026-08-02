"use client";

import Link from "next/link";
import { Award, Search, UserRound, MapPin, Heart, ShieldCheck, ArrowLeft, Briefcase, Building2, CalendarCheck, CalendarClock, CalendarDays, ExternalLink, BadgeCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportIssueButton } from "@/modules/report/report-issue-button";
import { SiteLayout } from "@/modules/layout/site-layout";
import { marketplaceService } from "@/services/marketplace.service";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { RatingStars } from "@/shared/components/common/rating-stars";
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
import { WEEKDAY_ORDER, weekdayKey } from "@/shared/utils/enum-label.util";

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

export function TrainersDirectoryPage() {
  const t = useTranslations();
  const [keyword, setKeyword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [params, setParams] = useState<{ keyword?: string; specialization?: string; serviceArea?: string }>({});
  // UC-008: sắp xếp kết quả — sort theo field entity (BE Spring Pageable).
  const [sort, setSort] = useState("createdAt,desc");
  const query = useQuery({
    queryKey: ["marketplace", "pts", params, sort],
    queryFn: () => marketplaceService.searchPts({ ...params, sort }),
  });
  const { isCustomer, ids, toggle } = useFavorites();

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setParams({
      keyword: keyword || undefined,
      specialization: specialization || undefined,
      serviceArea: serviceArea || undefined,
    });
  }
  function clearAll() {
    setKeyword(""); setSpecialization(""); setServiceArea(""); setParams({});
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
                      checked={specialization === spec.value}
                      onCheckedChange={() =>
                        setSpecialization(specialization === spec.value ? "" : spec.value)
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
          <section className="min-w-0 flex-1">
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
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((pt) => (
                  <article key={pt.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="relative grid h-40 place-items-center bg-gradient-to-br from-primary to-primary text-primary-foreground">
                      <UserRound className="size-14 opacity-90" />
                      {/* Bug 14: badge data-driven — chỉ hiện khi PT thật sự được xác thực. */}
                      {pt.verified && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success-foreground">
                          <ShieldCheck className="size-3" /> {t("marketplace.verifiedShort")}
                        </span>
                      )}
                      {isCustomer && pt.id != null && (
                        <button
                          onClick={() => toggle.mutate({ id: pt.id!, fav: ids.has(pt.id) })}
                          disabled={toggle.isPending}
                          aria-label={t("marketplace.favorite")}
                          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Heart className={`size-4 ${ids.has(pt.id) ? "fill-destructive text-destructive" : ""}`} />
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-base font-bold text-foreground">{pt.displayName}</h2>
                      {pt.specialization && <p className="text-xs font-semibold text-primary mt-0.5">{pt.specialization}</p>}
                      {/* UC-071: sao đánh giá ngay trên card (bug 5). */}
                      <div className="mt-1.5"><RatingStars rating={pt.averageRating} count={pt.reviewCount} /></div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{t("marketplace.yearsExperience", { years: pt.experienceYears ?? 0 })}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pt.bio || t("marketplace.noDescription")}</p>
                      {pt.serviceArea && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />{pt.serviceArea}
                        </p>
                      )}
                      {/* Bug 3: điều hướng nhanh sang phòng gym quản lý PT. */}
                      {pt.gymId != null && (
                        <Link
                          href={`/gyms/${pt.gymId}`}
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Building2 className="size-3.5" />{pt.gymName || t("marketplace.viewGymOf")}
                        </Link>
                      )}
                      <Link
                        href={`/trainers/${pt.id}`}
                        className="mt-4 flex items-center justify-center gap-2 h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
                      >{t("common.actions.viewDetail")}</Link>
                    </div>
                  </article>
                ))}
              </div>
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
 * Bug S2-14: thời gian biểu tuần của PT. Đây là lịch RẢNH khai báo, không trừ các
 * buổi đã có người đặt — nói rõ để khách không hiểu nhầm là "chắc chắn còn chỗ".
 */
function TrainerWeeklySchedule({ ptId }: { ptId: number }) {
  const t = useTranslations();
  const query = useQuery({
    queryKey: ["marketplace", "pt", ptId, "availability"],
    queryFn: () => marketplaceService.getPtAvailability(ptId),
  });

  const byDay = new Map<number, string[]>();
  for (const slot of query.data ?? []) {
    if (slot.dayOfWeek == null || !slot.startTime || !slot.endTime) continue;
    const list = byDay.get(slot.dayOfWeek) ?? [];
    list.push(`${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`);
    byDay.set(slot.dayOfWeek, list);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <CalendarClock className="size-5 text-primary" /> {t("marketplace.weeklySchedule")}
      </h2>
      {query.isLoading ? (
        <div className="mt-3"><LoadingSkeleton /></div>
      ) : !byDay.size ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("marketplace.noSchedule")}</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border">
            {WEEKDAY_ORDER.map((day) => {
              const ranges = byDay.get(day);
              return (
                <li key={day} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm font-semibold text-foreground">{t(weekdayKey(day))}</span>
                  {ranges?.length ? (
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {ranges.map((range) => (
                        <span key={range} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                          {range}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("marketplace.dayOff")}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{t("marketplace.scheduleHint")}</p>
        </>
      )}
    </section>
  );
}

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
                {fav ? t("marketplace.favorited") : "Yêu thích"}
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

          {/* Bug S2-14: bảng thời gian biểu để khách biết PT nhận buổi giờ nào. */}
          {pt.id != null && (
            <div className="lg:col-span-2">
              <TrainerWeeklySchedule ptId={pt.id} />
            </div>
          )}

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
              {/* Bug S2-13: đặt lịch thẳng với chính PT đang xem — wizard mở sẵn gym
                  và PT này, khách chỉ còn chọn dịch vụ rồi tới bước địa điểm/giờ.
                  Chỉ khách hàng mới đặt được nên ẩn với gym/PT/khách vãng lai. */}
              {isCustomer && pt.id != null && pt.gymId != null && (
                <Link
                  href={`/profile/bookings?create=1&gymId=${pt.gymId}&ptId=${pt.id}`}
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
      </main>
    </SiteLayout>
  );
}
