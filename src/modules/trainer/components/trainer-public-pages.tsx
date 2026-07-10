"use client";

import Link from "next/link";
import { Award, Search, UserRound, MapPin, Heart, ShieldCheck } from "lucide-react";
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
            <form onSubmit={apply} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0f172a]">Bộ lọc</h2>
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-[#2563eb] hover:underline">Xóa tất cả</button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Từ khóa</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input className="pl-9 h-10" placeholder="Tên hoặc chuyên môn..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Chuyên môn</p>
                <div className="space-y-1.5">
                  {SPECIALIZATIONS.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Địa điểm</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input className="pl-9 h-10" placeholder="Nhập thành phố / khu vực..." value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="mt-5 w-full gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                <Search className="size-4" /> Áp dụng
              </Button>
            </form>
          </aside>

          {/* Results */}
          <section className="min-w-0 flex-1">
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-[#0f172a]">Huấn luyện viên cá nhân</h1>
              <p className="text-sm text-gray-500 mt-0.5">Đang hiển thị {total} chuyên gia trong khu vực của bạn.</p>
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title="Không thể tải danh sách" description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((pt) => (
                  <article key={pt.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className={`size-4 ${ids.has(pt.id) ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-base font-bold text-[#0f172a]">{pt.displayName}</h2>
                      {pt.specialization && <p className="text-xs font-semibold text-[#2563eb] mt-0.5">{pt.specialization}</p>}
                      <p className="mt-1 text-[11px] text-gray-400">{pt.experienceYears ?? 0} năm kinh nghiệm</p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{pt.bio || "Chưa có mô tả"}</p>
                      {pt.serviceArea && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="size-3.5" />{pt.serviceArea}
                        </p>
                      )}
                      <Link
                        href={`/trainers/${pt.id}`}
                        className="mt-4 flex items-center justify-center gap-2 h-9 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors"
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
  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-24 place-items-center rounded-full bg-white/15 text-3xl font-black">
              <UserRound className="size-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black">{pt.displayName}</h1>
              {pt.specialization && <p className="mt-1 font-bold text-blue-100">{pt.specialization}</p>}
              <p className="mt-2 text-blue-100">{pt.bio || "Chưa có mô tả"}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold">
                <span>{pt.experienceYears ?? 0} năm kinh nghiệm</span>
                {pt.serviceArea && <span>· {pt.serviceArea}</span>}
              </div>
              {isCustomer && pt.id != null && (
                <button
                  onClick={() => toggle.mutate({ id: pt.id!, fav: ids.has(pt.id) })}
                  disabled={toggle.isPending}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25 transition-colors"
                >
                  <Heart className={`size-4 ${ids.has(pt.id) ? "fill-red-400 text-red-400" : ""}`} />
                  {ids.has(pt.id) ? "Đã yêu thích" : "Yêu thích"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black"><Award className="size-6" /> Chứng chỉ</h2>
          {pt.certifications?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pt.certifications.map((cert) => (
                <article key={cert.id} className="rounded-xl border border-border p-5">
                  <h3 className="font-black">{cert.name}</h3>
                  {cert.issuingOrganization && <p className="mt-1 text-sm text-muted-foreground">{cert.issuingOrganization}</p>}
                  <p className="mt-3 text-xs font-bold">{cert.issueDate || "Chưa có ngày cấp"}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có chứng chỉ" description="Huấn luyện viên này chưa có chứng chỉ nào." />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
