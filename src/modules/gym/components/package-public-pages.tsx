"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Dumbbell,
  Layers,
  MapPin,
  Package,
  Phone,
  Search,
  Timer,
  Wallet,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  marketplaceService,
  type GymPublicProfile,
  type PublicTrainingPackage,
} from "@/services/marketplace.service";
import { SiteLayout } from "@/modules/layout/site-layout";
import { useAuthStore } from "@/modules/auth/auth.store";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toErrorMessage } from "@/shared/utils/error.util";
import { formatCurrency } from "@/utils/format.util";

function useCanBook() {
  const { user, status } = useAuthStore();
  return status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
}

type PackageWithGym = PublicTrainingPackage & { gym: GymPublicProfile };

function perSession(item: PublicTrainingPackage) {
  if (!item.price || !item.sessionCount) return undefined;
  return Math.round(item.price / item.sessionCount);
}

const priceRanges = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "under1m", label: "Dưới 1 triệu", min: 0, max: 1_000_000 },
  { value: "m1to3", label: "1 – 3 triệu", min: 1_000_000, max: 3_000_000 },
  { value: "m3to10", label: "3 – 10 triệu", min: 3_000_000, max: 10_000_000 },
  { value: "over10", label: "Trên 10 triệu", min: 10_000_000, max: Infinity },
] as const;

const sortOptions = [
  { value: "default", label: "Mặc định" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "sessions-desc", label: "Nhiều buổi nhất" },
] as const;

export function PackagesPublicPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [gymFilter, setGymFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sort, setSort] = useState("default");

  // BE chỉ có catalog gói theo từng gym (UC-009) — gom từ các gym đang hiển thị trên marketplace.
  const gymsQuery = useQuery({
    queryKey: ["marketplace", "gyms", "packages-page"],
    queryFn: () => marketplaceService.searchGyms({ size: 24 }),
  });
  const gymList = gymsQuery.data?.content ?? [];

  const packageQueries = useQueries({
    queries: gymList.map((gym) => ({
      queryKey: ["marketplace", "gym", gym.id, "packages"],
      queryFn: () => marketplaceService.getGymPackages(gym.id!),
      enabled: gym.id != null,
      staleTime: 60_000,
    })),
  });

  // isPending (thay vì isLoading) để SSR/hydration đầu tiên hiển thị skeleton thay vì "0 kết quả".
  const isLoading =
    gymsQuery.isPending || packageQueries.some((query) => query.isPending && !query.isError);

  const allPackages: PackageWithGym[] = gymList.flatMap((gym, index) =>
    (packageQueries[index]?.data ?? []).map((item) => ({ ...item, gym })),
  );

  const gymsWithPackages = gymList.filter((gym, index) =>
    (packageQueries[index]?.data ?? []).length > 0,
  );

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setAppliedKeyword(keyword.trim().toLowerCase());
  }
  function clearAll() {
    setKeyword("");
    setAppliedKeyword("");
    setGymFilter("all");
    setPriceFilter("all");
    setSort("default");
  }

  const range = priceRanges.find((r) => r.value === priceFilter);
  const filtered = allPackages
    .filter((item) => {
      if (appliedKeyword) {
        const haystack = [item.name, item.gym.gymName, item.gymServiceName, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(appliedKeyword)) return false;
      }
      if (gymFilter !== "all" && String(item.gym.id) !== gymFilter) return false;
      if (range && "min" in range) {
        const price = item.price ?? 0;
        if (price < range.min || price >= range.max) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
      if (sort === "sessions-desc") return (b.sessionCount ?? 0) - (a.sessionCount ?? 0);
      return 0;
    });

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
                  <Input className="pl-9 h-10" placeholder="Tìm kiếm gói tập..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Phòng gym</p>
                <Select value={gymFilter} onValueChange={setGymFilter}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng gym</SelectItem>
                    {gymsWithPackages.map((gym) => (
                      <SelectItem key={gym.id} value={String(gym.id)}>{gym.gymName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Mức giá</p>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Sắp xếp</p>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="mt-5 w-full gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                <Search className="size-4" /> Áp dụng
              </Button>
            </form>
          </aside>

          {/* Results */}
          <section className="min-w-0 flex-1">
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-[#0f172a]">Danh sách gói tập</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tìm thấy {filtered.length} gói tập từ {gymsWithPackages.length} phòng gym.
              </p>
            </div>

            {isLoading ? (
              <LoadingSkeleton />
            ) : gymsQuery.isError ? (
              <EmptyState title="Không thể tải danh sách gói tập" description={toErrorMessage(gymsQuery.error)} />
            ) : filtered.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <PackagePublicCard key={`${item.gym.id}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Không tìm thấy gói tập"
                description="Thử thay đổi bộ lọc tìm kiếm, hoặc quay lại sau khi các phòng gym công bố thêm gói tập."
              />
            )}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

function PackagePublicCard({ item }: { item: PackageWithGym }) {
  const unit = perSession(item);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="relative grid h-32 place-items-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <Package className="size-10 opacity-90" />
        <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
          <Layers className="size-3" /> {item.sessionCount ?? "—"} buổi
        </span>
        {item.gymServiceName && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
            {item.gymServiceName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base font-bold text-[#0f172a]">{item.name}</h2>
        <Link
          href={`/gyms/${item.gym.id}`}
          className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-[#2563eb]"
        >
          <Building2 className="size-3.5" />
          {item.gym.gymName}{item.gym.city ? ` · ${item.gym.city}` : ""}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.description || "Chưa có mô tả"}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-black text-[#2563eb]">{formatCurrency(item.price ?? 0)}</span>
          {unit !== undefined && (
            <span className="text-xs text-gray-400">≈ {formatCurrency(unit)}/buổi</span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarDays className="size-3.5 text-gray-400" />
          Hiệu lực {item.validityDays ?? "—"} ngày kể từ khi kích hoạt
        </p>

        <div className="mt-auto pt-4">
          <Link
            href={`/packages/${item.id}?gym=${item.gym.id}`}
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PackagePublicDetailPage({ packageId, gymId }: { packageId: number; gymId?: number }) {
  const canBook = useCanBook();

  const gymQuery = useQuery({
    queryKey: ["marketplace", "gym", gymId],
    queryFn: () => marketplaceService.getGym(gymId!),
    enabled: gymId != null,
  });
  const packagesQuery = useQuery({
    queryKey: ["marketplace", "gym", gymId, "packages"],
    queryFn: () => marketplaceService.getGymPackages(gymId!),
    enabled: gymId != null,
  });

  if (gymId == null)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-4xl px-4 py-10">
          <EmptyState
            title="Thiếu thông tin phòng gym"
            description="Đường dẫn gói tập không hợp lệ. Vui lòng mở gói tập từ trang danh sách."
          />
          <div className="mt-4 text-center">
            <Link href="/packages" className="text-sm font-semibold text-[#2563eb] hover:underline">Về danh sách gói tập</Link>
          </div>
        </main>
      </SiteLayout>
    );

  if (gymQuery.isPending || packagesQuery.isPending)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-6xl px-4 py-10"><LoadingSkeleton /></main>
      </SiteLayout>
    );

  const item = packagesQuery.data?.find((entry) => entry.id === packageId);
  if (packagesQuery.isError || !item)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-4xl px-4 py-10">
          <EmptyState
            title="Không tìm thấy gói tập"
            description={packagesQuery.isError ? toErrorMessage(packagesQuery.error) : "Gói tập không tồn tại hoặc đã ngưng bán."}
          />
          <div className="mt-4 text-center">
            <Link href="/packages" className="text-sm font-semibold text-[#2563eb] hover:underline">Về danh sách gói tập</Link>
          </div>
        </main>
      </SiteLayout>
    );

  const gym = gymQuery.data;
  const fullAddress = [gym?.address, gym?.city].filter(Boolean).join(", ");
  const unit = perSession(item);
  const rules = item.bookingRules;
  const ruleLines = [
    {
      icon: Wallet,
      text:
        rules?.depositPercent != null
          ? `Đặt cọc ${rules.depositPercent}% giá trị gói khi đặt lịch`
          : "Thanh toán toàn bộ khi đặt lịch",
    },
    ...(rules?.freeCancellationHours != null
      ? [{ icon: Clock, text: `Hủy miễn phí trước ${rules.freeCancellationHours} giờ` }]
      : []),
    ...(rules?.minNoticeHours != null
      ? [{ icon: Timer, text: `Cần đặt lịch trước tối thiểu ${rules.minNoticeHours} giờ` }]
      : []),
  ];

  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/packages" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#2563eb]">
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>

        {/* Hero cover */}
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-44 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 sm:h-52">
            <div className="absolute inset-0 grid place-items-center opacity-20"><Package className="size-24 text-white" /></div>
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              <BadgeCheck className="size-3.5" /> Gói tập
            </span>
            {item.gymServiceName && (
              <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Dumbbell className="size-3.5" /> {item.gymServiceName}
              </span>
            )}
          </div>
          <div className="px-6 pb-6 pt-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-[#0f172a]">{item.name}</h1>
                {gym && (
                  <Link href={`/gyms/${gym.id}`} className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2563eb]">
                    <Building2 className="size-4 text-[#2563eb]" />{gym.gymName}{gym.city ? ` · ${gym.city}` : ""}
                  </Link>
                )}
              </div>
              <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2563eb]">
                <Layers className="size-3.5" /> {item.sessionCount ?? "—"} buổi tập
              </span>
            </div>
          </div>
        </section>

        {/* Info tiles */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Wallet, label: "Giá gói", value: formatCurrency(item.price ?? 0) },
            { icon: Layers, label: "Số buổi", value: `${item.sessionCount ?? "—"} buổi` },
            { icon: CalendarDays, label: "Hiệu lực", value: `${item.validityDays ?? "—"} ngày` },
            { icon: Timer, label: "Giá mỗi buổi", value: unit !== undefined ? formatCurrency(unit) : "—" },
          ].map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <tile.icon className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{tile.label}</span>
              </div>
              <p className="mt-1.5 truncate text-[15px] font-bold text-[#0f172a]">{tile.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            {/* About */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#0f172a]"><Package className="size-5 text-[#2563eb]" /> Mô tả gói tập</h2>
              <p className="mt-3 leading-relaxed text-gray-600 whitespace-pre-line">{item.description || "Phòng gym chưa cập nhật mô tả cho gói tập này."}</p>
            </section>

            {/* Usage conditions */}
            {item.usageConditions && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#0f172a]"><Check className="size-5 text-emerald-600" /> Điều kiện sử dụng</h2>
                <p className="mt-3 leading-relaxed text-gray-600 whitespace-pre-line">{item.usageConditions}</p>
              </section>
            )}

            {/* Booking rules */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#0f172a]"><Clock className="size-5 text-[#2563eb]" /> Chính sách đặt lịch & thanh toán</h2>
              <ul className="mt-4 space-y-3">
                {ruleLines.map((rule) => (
                  <li key={rule.text} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <rule.icon className="size-4 shrink-0 text-[#2563eb]" />
                    <span className="font-medium">{rule.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Purchase card */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Giá trọn gói</p>
              <p className="mt-1 text-3xl font-black text-[#2563eb]">{formatCurrency(item.price ?? 0)}</p>
              {unit !== undefined && (
                <p className="mt-1 text-xs text-gray-400">Tương đương {formatCurrency(unit)} cho mỗi buổi tập</p>
              )}
              <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Layers className="size-4 text-[#2563eb]" />{item.sessionCount ?? "—"} buổi tập</li>
                <li className="flex items-center gap-2"><CalendarDays className="size-4 text-[#2563eb]" />Hiệu lực {item.validityDays ?? "—"} ngày</li>
                {item.gymServiceName && (
                  <li className="flex items-center gap-2"><Dumbbell className="size-4 text-[#2563eb]" />Áp dụng cho {item.gymServiceName}</li>
                )}
              </ul>
              {canBook ? (
                <Link
                  href={`/profile/bookings?create=1&gymId=${gymId}&packageId=${item.id}`}
                  className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                >
                  Đặt gói này
                </Link>
              ) : (
                <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
                  Đăng nhập bằng tài khoản khách hàng để đặt gói tập.
                </p>
              )}
            </div>

            {gym && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[#0f172a]">Phòng gym</h3>
                <p className="mt-2 text-sm font-semibold text-gray-700">{gym.gymName}</p>
                <div className="mt-3 space-y-3 text-sm">
                  {fullAddress && (
                    <p className="flex items-start gap-2 text-gray-600"><MapPin className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />{fullAddress}</p>
                  )}
                  {gym.phone && (
                    <p className="flex items-center gap-2 text-gray-600"><Phone className="size-4 shrink-0 text-[#2563eb]" />{gym.phone}</p>
                  )}
                </div>
                <Link href={`/gyms/${gym.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] hover:underline">
                  Xem phòng tập <ArrowLeft className="size-3.5 rotate-180" />
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </SiteLayout>
  );
}
