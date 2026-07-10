"use client";

import Link from "next/link";
import { Building2, MapPin, Phone, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplace.service";
import { SiteLayout } from "@/modules/layout/site-layout";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";

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
            <form onSubmit={apply} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0f172a]">Bộ lọc</h2>
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-[#2563eb] hover:underline">Thiết lập lại</button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Từ khóa</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input className="pl-9 h-10" placeholder="Tìm kiếm phòng tập..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Vị trí</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input className="pl-9 h-10" placeholder="Nhập thành phố..." value={city} onChange={(e) => setCity(e.target.value)} />
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
              <h1 className="text-2xl font-bold text-[#0f172a]">Phòng tập trong khu vực của bạn</h1>
              <p className="text-sm text-gray-500 mt-0.5">Tìm thấy {total} phòng tập{params.city ? ` gần ${params.city}` : ""}.</p>
            </div>

            {query.isLoading ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <EmptyState title="Không thể tải danh sách phòng gym" description={toErrorMessage(query.error)} />
            ) : items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((gym) => (
                  <article key={gym.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="relative grid h-36 place-items-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <Building2 className="size-12 opacity-90" />
                      <span className="absolute left-3 bottom-3 inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        Đang mở cửa
                      </span>
                    </div>
                    <div className="p-4">
                      <h2 className="text-base font-bold text-[#0f172a]">{gym.gymName}</h2>
                      {(gym.address || gym.city) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="size-3.5" />{[gym.address, gym.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{gym.description || "Chưa có mô tả"}</p>
                      <div className="mt-4 flex items-center justify-end">
                        <Link
                          href={`/gyms/${gym.id}`}
                          className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors"
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
  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-7 text-white shadow-xl">
          <h1 className="text-4xl font-black">{g.gymName}</h1>
          {g.description && <p className="mt-3 max-w-3xl text-blue-100">{g.description}</p>}
          {(g.address || g.city) && (
            <p className="mt-5 flex items-center gap-2 font-bold">
              <MapPin className="size-5" />{[g.address, g.city].filter(Boolean).join(", ")}
            </p>
          )}
          {g.phone && (
            <p className="mt-2 flex items-center gap-2 text-blue-100">
              <Phone className="size-4" />{g.phone}
            </p>
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
