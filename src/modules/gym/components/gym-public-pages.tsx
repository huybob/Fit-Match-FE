"use client";

import Link from "next/link";
import { Building2, MapPin, Search, Star } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  useGymBranches,
  useGymDetail,
  useGymFacilities,
  useSearchGyms,
} from "@/modules/gym/hooks/use-gym";
import { SiteLayout } from "@/modules/layout/site-layout";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";

export function GymsPublicPage() {
  const [filters, setFilters] = useState({
    keyword: "",
    city: "",
    district: "",
    minRating: "",
  });
  const [params, setParams] = useState({});
  const query = useSearchGyms(params);

  function search(event: FormEvent) {
    event.preventDefault();
    setParams({
      ...filters,
      minRating: filters.minRating ? Number(filters.minRating) : undefined,
    });
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-widest text-accent">
            {"Khám phá phòng gym"}
          </p>
          <h1 className="mt-2 text-4xl font-black">{"Danh sách phòng gym"}</h1>
          <p className="mt-3 text-muted-foreground">
            {"Tìm kiếm và khám phá các phòng gym phù hợp với bạn."}
          </p>
        </div>
        <form
          className="mt-7 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={search}
        >
          <Input
            aria-label={"Từ khóa"}
            placeholder={"Từ khóa"}
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value })
            }
          />
          <Input
            aria-label={"Thành phố"}
            placeholder={"Thành phố"}
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
          <Input
            aria-label={"Quận/Huyện"}
            placeholder={"Quận/Huyện"}
            value={filters.district}
            onChange={(e) =>
              setFilters({ ...filters, district: e.target.value })
            }
          />
          <Input
            aria-label={"Đánh giá tối thiểu"}
            min="0"
            max="5"
            step="0.5"
            placeholder={"Đánh giá tối thiểu"}
            type="number"
            value={filters.minRating}
            onChange={(e) =>
              setFilters({ ...filters, minRating: e.target.value })
            }
          />
          <Button>
            <Search className="size-4" />
            {"Tìm kiếm"}
          </Button>
        </form>
        <section className="mt-8">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState
              title={"Không thể tải danh sách phòng gym"}
              description={toErrorMessage(query.error)}
            />
          ) : query.data?.content?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {query.data.content.map((gym) => (
                <article
                  key={gym.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="grid h-36 place-items-center bg-zinc-950 text-primary">
                    <Building2 className="size-12" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-black">{gym.name}</h2>
                      <Badge>
                        {({ active: "Đang hoạt động", inactive: "Ngừng hoạt động", pending: "Đang chờ", approved: "Đã chấp nhận", rejected: "Đã từ chối", ended: "Đã kết thúc", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Đã hủy" } as Record<string, string>)[String(gym.status).toLowerCase()] ?? gym.status}
                      </Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      {gym.district}, {gym.city}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm">
                      {gym.description || "Chưa có mô tả"}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <Star className="size-4 fill-accent text-accent" />
                        {gym.averageRating ?? 0}
                      </span>
                      <Link
                        className="font-black text-accent"
                        href={`/gyms/${gym.id}`}
                      >
                        {"Xem phòng gym"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={"Không tìm thấy phòng gym"}
              description={"Thử thay đổi bộ lọc tìm kiếm để xem thêm kết quả."}
            />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}

export function GymPublicDetailPage({ gymId }: { gymId: number }) {
  const gym = useGymDetail(gymId);
  const branches = useGymBranches(gymId);
  const facilities = useGymFacilities(gymId);

  if (gym.isLoading)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-6xl px-4 py-10">
          <LoadingSkeleton />
        </main>
      </SiteLayout>
    );
  if (gym.isError || !gym.data)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-4xl px-4 py-10">
          <EmptyState
            title={"Không tìm thấy phòng gym"}
            description={toErrorMessage(gym.error)}
          />
        </main>
      </SiteLayout>
    );

  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950 p-7 text-white shadow-xl shadow-zinc-950/10">
          <Badge>
            {({ active: "Đang hoạt động", inactive: "Ngừng hoạt động", pending: "Đang chờ", approved: "Đã chấp nhận", rejected: "Đã từ chối", ended: "Đã kết thúc", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Đã hủy" } as Record<string, string>)[String(gym.data.status).toLowerCase()] ?? gym.data.status}
          </Badge>
          <h1 className="mt-4 text-4xl font-black">{gym.data.name}</h1>
          <p className="mt-3 max-w-3xl text-zinc-300">{gym.data.description}</p>
          <p className="mt-5 flex items-center gap-2 font-bold">
            <MapPin className="size-5 text-primary" />
            {gym.data.address}, {gym.data.district}, {gym.data.city}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-black">
            {"Chi nhánh"}
          </h2>
          {branches.data?.content?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {branches.data.content.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-xl border border-border p-5"
                >
                  <h3 className="font-black">{branch.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {branch.address}, {branch.district}
                  </p>
                  <p className="mt-3 text-sm font-bold">
                    {branch.phone || "Chưa có số điện thoại"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={"Chưa có chi nhánh"}
              description={"Phòng gym này chưa có chi nhánh nào được thêm vào."}
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-black">
            {"Cơ sở vật chất"}
          </h2>
          {facilities.data?.content?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.data.content.map((facility) => (
                <article
                  key={facility.id}
                  className="rounded-xl border border-border p-5"
                >
                  <div className="flex justify-between">
                    <h3 className="font-black">{facility.name}</h3>
                    <Badge>
                      {facility.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {facility.description}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={"Chưa có cơ sở vật chất"}
              description={"Phòng gym này chưa có thông tin cơ sở vật chất."}
            />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
