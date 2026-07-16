"use client";

import Link from "next/link";
import { Building2, MapPin, Phone, Search, ArrowLeft, BadgeCheck, Clock, Dumbbell, Sparkles, Package, GitBranch, Users, Heart } from "lucide-react";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplace.service";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { SiteLayout } from "@/modules/layout/site-layout";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";

const DAY_SHORT: Record<number, string> = { 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7", 7: "CN" };

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
  const { isCustomer, ids, toggle } = useGymFavorites();
  if (!isCustomer) return null;
  const fav = ids.has(gymId);
  return (
    <button
      type="button"
      aria-label={fav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id: gymId, fav })}
      className="grid size-9 place-items-center rounded-lg border border-border bg-card transition-colors hover:border-red-300"
    >
      <Heart className={`size-4 ${fav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
    </button>
  );
}

export function GymsPublicPage() {
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [params, setParams] = useState<{ keyword?: string; city?: string }>({});
  const query = useQuery({
    queryKey: ["marketplace", "gyms", params],
    queryFn: () => marketplaceService.searchGyms(params),
  });

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setParams({
      keyword: keyword || undefined,
      city: city || undefined,
    });
  }
  function clearAll() {
    setKeyword(""); setCity(""); setParams({});
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
                <h2 className="text-base font-bold text-foreground">Bộ lọc</h2>
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">Thiết lập lại</button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Từ khóa</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-10" placeholder="Tìm kiếm phòng tập..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Vị trí</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-10" placeholder="Nhập thành phố..." value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="mt-5 w-full gap-2 bg-primary hover:bg-primary/90 text-white">
                <Search className="size-4" /> Áp dụng
              </Button>
            </form>
          </aside>

          {/* Results */}
          <section className="min-w-0 flex-1">
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-foreground">Phòng tập trong khu vực của bạn</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Tìm thấy {total} phòng tập{params.city ? ` gần ${params.city}` : ""}.</p>
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title="Không thể tải danh sách phòng gym" description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((gym) => (
                  <article key={gym.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {/* A-19: gỡ badge "Đang mở cửa" hardcode — giờ mở cửa thật ở trang chi tiết */}
                    <div className="relative grid h-36 place-items-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <Building2 className="size-12 opacity-90" />
                    </div>
                    <div className="p-4">
                      <h2 className="text-base font-bold text-foreground">{gym.gymName}</h2>
                      {(gym.address || gym.city) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />{[gym.address, gym.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{gym.description || "Chưa có mô tả"}</p>
                      <div className="mt-4 flex items-center justify-between">
                        {gym.id != null ? <GymFavoriteButton gymId={gym.id} /> : <span />}
                        <Link
                          href={`/gyms/${gym.id}`}
                          className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Không tìm thấy phòng gym" description="Thử thay đổi bộ lọc tìm kiếm để xem thêm kết quả." />
            )}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

export function GymPublicDetailPage({ gymId }: { gymId: number }) {
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
          <EmptyState title="Không tìm thấy phòng gym" description={toErrorMessage(gym.error)} />
        </main>
      </SiteLayout>
    );

  const g = gym.data;
  const fullAddress = [g.address, g.city].filter(Boolean).join(", ");
  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/gyms" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>

        {/* Hero cover */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative h-48 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 sm:h-56">
            <div className="absolute inset-0 grid place-items-center opacity-20"><Building2 className="size-28 text-white" /></div>
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              <BadgeCheck className="size-3.5" /> Đã xác minh
            </span>
          </div>
          <div className="px-6 pb-6 pt-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-foreground">{g.gymName}</h1>
                {fullAddress && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" />{fullAddress}
                  </p>
                )}
              </div>
              {/* A-19: gỡ badge "Đang mở cửa" hardcode — giờ mở cửa thật hiển thị theo chi nhánh bên dưới */}
              {/* A-11: yêu thích gym ngay từ trang chi tiết */}
              <GymFavoriteButton gymId={gymId} />
            </div>
          </div>
        </section>

        {/* Info tiles */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPin, label: "Địa chỉ", value: g.address || "—" },
            { icon: Building2, label: "Thành phố", value: g.city || "—" },
            { icon: Phone, label: "Điện thoại", value: g.phone || "—" },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <t.icon className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{t.label}</span>
              </div>
              <p className="mt-1.5 truncate text-[15px] font-bold text-foreground">{t.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* About */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Dumbbell className="size-5 text-primary" /> Giới thiệu</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{g.description || "Phòng gym chưa cập nhật phần giới thiệu."}</p>
          </section>

          {/* Contact card */}
          <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm h-max">
            <h3 className="text-sm font-bold text-foreground">Liên hệ</h3>
            <div className="mt-3 space-y-3 text-sm">
              {fullAddress && (
                <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{fullAddress}</p>
              )}
              {g.phone && (
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4 shrink-0 text-primary" />{g.phone}</p>
              )}
            </div>
          </aside>
        </div>

        {/* B-25: Dịch vụ đang bán */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Sparkles className="size-5 text-primary" /> Dịch vụ</h2>
          {services.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(services.data ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">Chưa có dịch vụ đang bán.</p>
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
                    <p className="mt-1 text-[11px] text-muted-foreground">Đặt cọc {s.bookingRules.depositPercent}%</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* B-25: Gói tập */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Package className="size-5 text-primary" /> Gói tập</h2>
          {packages.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(packages.data ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">Chưa có gói tập đang bán.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(packages.data ?? []).map((p) => (
                <div key={p.id} className="rounded-2xl border border-border p-4">
                  <p className="font-bold text-foreground">{p.name}</p>
                  {p.gymServiceName && <p className="text-[11px] font-semibold text-primary">Dịch vụ: {p.gymServiceName}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.sessionCount} buổi{p.validityDays != null ? ` · hạn ${p.validityDays} ngày` : ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-extrabold text-primary">{p.price != null ? formatCurrency(p.price) : "—"}</span>
                    {p.sessionCount ? (
                      <span className="text-xs text-muted-foreground">≈ {formatCurrency(Math.round((p.price ?? 0) / p.sessionCount))}/buổi</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* B-25: Chi nhánh + giờ mở cửa thật */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><GitBranch className="size-5 text-primary" /> Chi nhánh</h2>
          {branches.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(branches.data ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">Chưa có thông tin chi nhánh.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(branches.data ?? []).map((b) => (
                <div key={b.id} className="rounded-2xl border border-border p-4">
                  <p className="font-bold text-foreground">{b.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{[b.address, b.city].filter(Boolean).join(", ")}</p>
                  {b.amenities && <p className="mt-1 text-[11px] text-muted-foreground">Tiện ích: {b.amenities}</p>}
                  {!!b.operatingHours?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {b.operatingHours
                        .filter((h) => !h.closed && h.dayOfWeek != null)
                        .sort((a, c) => (a.dayOfWeek ?? 0) - (c.dayOfWeek ?? 0))
                        .map((h) => (
                          <span key={h.dayOfWeek} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {DAY_SHORT[h.dayOfWeek!]} {h.openTime?.slice(0, 5)}–{h.closeTime?.slice(0, 5)}
                          </span>
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
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Users className="size-5 text-primary" /> Huấn luyện viên</h2>
          {pts.isLoading ? (
            <div className="mt-3"><LoadingSkeleton /></div>
          ) : !(pts.data?.content ?? []).length ? (
            <p className="mt-3 text-sm text-muted-foreground">Chưa có huấn luyện viên hoạt động.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(pts.data?.content ?? []).map((pt) => (
                <Link key={pt.id} href={`/trainers/${pt.id}`} className="rounded-2xl border border-border p-4 transition-colors hover:border-primary/50">
                  <p className="font-bold text-foreground">{pt.displayName ?? "Huấn luyện viên"}</p>
                  {pt.specialization && <p className="text-[11px] font-semibold text-primary">{pt.specialization}</p>}
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{pt.bio}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
