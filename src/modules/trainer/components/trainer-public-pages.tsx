"use client";

import Link from "next/link";
import { Award, Search, UserRound, MapPin } from "lucide-react";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/modules/layout/site-layout";
import { marketplaceService } from "@/services/marketplace.service";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";

export function TrainersDirectoryPage() {
  const [filters, setFilters] = useState({ keyword: "", specialization: "", serviceArea: "" });
  const [params, setParams] = useState<{ keyword?: string; specialization?: string; serviceArea?: string }>({});
  const query = useQuery({
    queryKey: ["marketplace", "pts", params],
    queryFn: () => marketplaceService.searchPts(params),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setParams({
      keyword: filters.keyword || undefined,
      specialization: filters.specialization || undefined,
      serviceArea: filters.serviceArea || undefined,
    });
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-sm font-black uppercase tracking-widest text-[#2563eb]">Khám phá huấn luyện viên</p>
        <h1 className="mt-3 text-4xl font-black">Danh sách huấn luyện viên</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">So sánh PT theo chuyên môn, khu vực và kinh nghiệm.</p>
        <form className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-4" onSubmit={submit}>
          <Input aria-label="Từ khóa" placeholder="Từ khóa" value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          <Input aria-label="Chuyên môn" placeholder="Chuyên môn" value={filters.specialization}
            onChange={(e) => setFilters({ ...filters, specialization: e.target.value })} />
          <Input aria-label="Khu vực" placeholder="Khu vực" value={filters.serviceArea}
            onChange={(e) => setFilters({ ...filters, serviceArea: e.target.value })} />
          <Button className="shrink-0" type="submit"><Search className="size-4" /> Tìm kiếm</Button>
        </form>

        <section className="mt-8">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title="Không thể tải danh sách" description={toErrorMessage(query.error)} />
          ) : query.data?.content?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {query.data.content.map((pt) => (
                <article key={pt.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserRound className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black">{pt.displayName}</h2>
                      {pt.specialization && <p className="truncate text-sm text-muted-foreground">{pt.specialization}</p>}
                    </div>
                  </div>
                  {pt.serviceArea && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-4" />{pt.serviceArea}
                    </p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm">{pt.bio || "Chưa có mô tả"}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-bold">{pt.experienceYears ?? 0} năm KN</span>
                    <Link className="font-black text-[#2563eb]" href={`/trainers/${pt.id}`}>Xem chi tiết</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Không tìm thấy huấn luyện viên" description="Thử thay đổi bộ lọc tìm kiếm." />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}

export function TrainerPublicDetailPage({ userId }: { userId: number }) {
  const query = useQuery({
    queryKey: ["marketplace", "pt", userId],
    queryFn: () => marketplaceService.getPt(userId),
  });

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
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                <span>{pt.experienceYears ?? 0} năm kinh nghiệm</span>
                {pt.serviceArea && <span>· {pt.serviceArea}</span>}
              </div>
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
