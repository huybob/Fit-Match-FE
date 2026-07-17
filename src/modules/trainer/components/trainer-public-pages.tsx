"use client";

import Link from "next/link";
import { Award, Search, UserRound, MapPin, Heart, ShieldCheck, ArrowLeft, Briefcase, CalendarDays, ExternalLink, BadgeCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/modules/layout/site-layout";
import { marketplaceService } from "@/services/marketplace.service";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";

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

const SPECIALIZATIONS = [
  "Thể hình (Bodybuilding)",
  "Giảm cân",
  "HIIT",
  "Yoga & Linh hoạt",
  "Sức mạnh & Thể lực",
  "Phục hồi",
];

export function TrainersDirectoryPage() {
  const [keyword, setKeyword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [params, setParams] = useState<{ keyword?: string; specialization?: string; serviceArea?: string }>({});
  const query = useQuery({
    queryKey: ["marketplace", "pts", params],
    queryFn: () => marketplaceService.searchPts(params),
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
                <h2 className="text-base font-bold text-foreground">Bộ lọc</h2>
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">Xóa tất cả</button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Từ khóa</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-10" placeholder="Tên hoặc chuyên môn..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Chuyên môn</p>
                <div className="space-y-1.5">
                  {SPECIALIZATIONS.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={specialization === s}
                        onChange={() => setSpecialization(specialization === s ? "" : s)}
                        className="size-4 accent-[#2563eb]"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Địa điểm</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-10" placeholder="Nhập thành phố / khu vực..." value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
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
              <h1 className="text-2xl font-bold text-foreground">Huấn luyện viên cá nhân</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Đang hiển thị {total} chuyên gia trong khu vực của bạn.</p>
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title="Không thể tải danh sách" description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((pt) => (
                  <article key={pt.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="relative grid h-40 place-items-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserRound className="size-14 opacity-90" />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <ShieldCheck className="size-3" /> Xác thực
                      </span>
                      {isCustomer && pt.id != null && (
                        <button
                          onClick={() => toggle.mutate({ id: pt.id!, fav: ids.has(pt.id) })}
                          disabled={toggle.isPending}
                          aria-label="Yêu thích"
                          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Heart className={`size-4 ${ids.has(pt.id) ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-base font-bold text-foreground">{pt.displayName}</h2>
                      {pt.specialization && <p className="text-xs font-semibold text-primary mt-0.5">{pt.specialization}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">{pt.experienceYears ?? 0} năm kinh nghiệm</p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pt.bio || "Chưa có mô tả"}</p>
                      {pt.serviceArea && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />{pt.serviceArea}
                        </p>
                      )}
                      <Link
                        href={`/trainers/${pt.id}`}
                        className="mt-4 flex items-center justify-center gap-2 h-9 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Không tìm thấy huấn luyện viên" description="Thử thay đổi bộ lọc tìm kiếm." />
            )}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

export function TrainerPublicDetailPage({ userId }: { userId: number }) {
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
          <EmptyState title="Không tìm thấy huấn luyện viên" description={toErrorMessage(query.error)} />
        </main>
      </SiteLayout>
    );

  const pt = query.data;
  const initials = (pt.displayName ?? "PT").split(" ").slice(-2).map((w) => w[0]?.toUpperCase()).join("");
  const certCount = pt.certifications?.length ?? 0;
  const fav = pt.id != null && ids.has(pt.id);

  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/trainers" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>

        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-900/10 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-card/15 text-3xl font-black ring-1 ring-white/20">
              {initials || <UserRound className="size-10" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black">{pt.displayName}</h1>
                <BadgeCheck className="size-6 text-blue-200" />
              </div>
              {pt.specialization && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card/15 px-3 py-1 text-sm font-bold">
                  <Briefcase className="size-3.5" /> {pt.specialization}
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-blue-100">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> {pt.experienceYears ?? 0} năm kinh nghiệm</span>
                {pt.serviceArea && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {pt.serviceArea}</span>}
                <span className="inline-flex items-center gap-1.5"><Award className="size-4" /> {certCount} chứng chỉ</span>
              </div>
            </div>
            {isCustomer && pt.id != null && (
              <button
                onClick={() => toggle.mutate({ id: pt.id!, fav })}
                disabled={toggle.isPending}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <Heart className={`size-4 ${fav ? "fill-red-500 text-red-500" : ""}`} />
                {fav ? "Đã yêu thích" : "Yêu thích"}
              </button>
            )}
          </div>
        </section>

        {/* Stats strip */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { icon: CalendarDays, label: "Kinh nghiệm", value: `${pt.experienceYears ?? 0} năm` },
            { icon: MapPin, label: "Khu vực", value: pt.serviceArea || "—" },
            { icon: Award, label: "Chứng chỉ", value: `${certCount}` },
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
            <h2 className="text-lg font-bold text-foreground">Giới thiệu</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">{pt.bio || "Huấn luyện viên chưa cập nhật phần giới thiệu."}</p>

            <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-foreground"><Award className="size-5 text-primary" /> Chứng chỉ &amp; bằng cấp</h2>
            {certCount ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pt.certifications!.map((cert) => (
                  <article key={cert.id} className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-primary"><ShieldCheck className="size-4.5" /></div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground">{cert.name}</h3>
                        {cert.issuingOrganization && <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cert.issueDate ? `Cấp: ${cert.issueDate}` : ""}{cert.expiryDate ? ` · HH: ${cert.expiryDate}` : ""}
                        </p>
                        {cert.credentialUrl && (
                          <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            <ExternalLink className="size-3" /> Xem chứng chỉ
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Chưa có chứng chỉ được công bố.</p>
            )}
          </section>

          {/* Summary / contact card */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground">Thông tin nhanh</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Chuyên môn</dt><dd className="font-semibold text-foreground">{pt.specialization || "—"}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Kinh nghiệm</dt><dd className="font-semibold text-foreground">{pt.experienceYears ?? 0} năm</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Khu vực</dt><dd className="font-semibold text-foreground">{pt.serviceArea || "—"}</dd></div>
              </dl>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-primary/10 p-6">
              <p className="text-sm font-semibold text-foreground">Quan tâm huấn luyện viên này?</p>
              <p className="mt-1 text-xs text-muted-foreground">Lưu vào yêu thích để dễ dàng theo dõi và liên hệ qua phòng gym.</p>
              {isCustomer && pt.id != null && (
                <button
                  onClick={() => toggle.mutate({ id: pt.id!, fav })}
                  disabled={toggle.isPending}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  <Heart className={`size-4 ${fav ? "fill-white" : ""}`} /> {fav ? "Bỏ yêu thích" : "Thêm yêu thích"}
                </button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </SiteLayout>
  );
}
