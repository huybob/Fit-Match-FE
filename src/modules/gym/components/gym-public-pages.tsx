"use client";

import Link from "next/link";
import { Building2, MapPin, Phone, Search, ArrowLeft, BadgeCheck, Clock, Dumbbell } from "lucide-react";
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
  const fullAddress = [g.address, g.city].filter(Boolean).join(", ");
  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/gyms" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#2563eb]">
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>

        {/* Hero cover */}
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-48 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 sm:h-56">
            <div className="absolute inset-0 grid place-items-center opacity-20"><Building2 className="size-28 text-white" /></div>
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              <BadgeCheck className="size-3.5" /> Đã xác minh
            </span>
          </div>
          <div className="px-6 pb-6 pt-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-[#0f172a]">{g.gymName}</h1>
                {fullAddress && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="size-4 text-[#2563eb]" />{fullAddress}
                  </p>
                )}
              </div>
              <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Clock className="size-3.5" /> Đang mở cửa
              </span>
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
            <div key={t.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <t.icon className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{t.label}</span>
              </div>
              <p className="mt-1.5 truncate text-[15px] font-bold text-[#0f172a]">{t.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* About */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#0f172a]"><Dumbbell className="size-5 text-[#2563eb]" /> Giới thiệu</h2>
            <p className="mt-3 leading-relaxed text-gray-600 whitespace-pre-line">{g.description || "Phòng gym chưa cập nhật phần giới thiệu."}</p>
          </section>

          {/* Contact card */}
          <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-max">
            <h3 className="text-sm font-bold text-[#0f172a]">Liên hệ</h3>
            <div className="mt-3 space-y-3 text-sm">
              {fullAddress && (
                <p className="flex items-start gap-2 text-gray-600"><MapPin className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />{fullAddress}</p>
              )}
              {g.phone && (
                <p className="flex items-center gap-2 text-gray-600"><Phone className="size-4 shrink-0 text-[#2563eb]" />{g.phone}</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </SiteLayout>
  );
}
