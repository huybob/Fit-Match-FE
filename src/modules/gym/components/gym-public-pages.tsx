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
  const [filters, setFilters] = useState({ keyword: "", city: "" });
  const [params, setParams] = useState<{ keyword?: string; city?: string }>({});
  const query = useQuery({
    queryKey: ["marketplace", "gyms", params],
    queryFn: () => marketplaceService.searchGyms(params),
  });

  function search(event: FormEvent) {
    event.preventDefault();
    setParams({
      keyword: filters.keyword || undefined,
      city: filters.city || undefined,
    });
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-widest text-[#2563eb]">Khám phá phòng gym</p>
          <h1 className="mt-2 text-4xl font-black">Danh sách phòng gym</h1>
          <p className="mt-3 text-muted-foreground">Tìm kiếm và khám phá các phòng gym phù hợp với bạn.</p>
        </div>
        <form className="mt-7 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-3" onSubmit={search}>
          <Input aria-label="Từ khóa" placeholder="Từ khóa" value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          <Input aria-label="Thành phố" placeholder="Thành phố" value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          <Button><Search className="size-4" /> Tìm kiếm</Button>
        </form>
        <section className="mt-8">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title="Không thể tải danh sách phòng gym" description={toErrorMessage(query.error)} />
          ) : query.data?.content?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {query.data.content.map((gym) => (
                <article key={gym.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="grid h-36 place-items-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <Building2 className="size-12" />
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-black">{gym.gymName}</h2>
                    {gym.city && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-4" />{gym.city}
                      </p>
                    )}
                    <p className="mt-3 line-clamp-2 text-sm">{gym.description || "Chưa có mô tả"}</p>
                    <div className="mt-5 flex items-center justify-end">
                      <Link className="font-black text-[#2563eb]" href={`/gyms/${gym.id}`}>Xem phòng gym</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Không tìm thấy phòng gym" description="Thử thay đổi bộ lọc tìm kiếm để xem thêm kết quả." />
          )}
        </section>
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
