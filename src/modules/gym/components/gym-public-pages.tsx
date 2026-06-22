"use client";

import Link from "next/link";
import { Building2, MapPin, Search, Star } from "lucide-react";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { inputClassName } from "@/modules/forms/form-controls";
import {
  useGymBranches,
  useGymDetail,
  useGymFacilities,
  useSearchGyms,
} from "@/modules/gym/hooks/use-gym";
import { SiteLayout } from "@/modules/layout/site-layout";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";

export function GymsPublicPage() {
  const { t } = useTranslation();
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
          <p className="text-sm font-black uppercase tracking-widest text-orange-600">
            {t("gymModule.discovery")}
          </p>
          <h1 className="mt-2 text-4xl font-black">{t("gymModule.title")}</h1>
          <p className="mt-3 text-zinc-500">{t("gymModule.description")}</p>
        </div>
        <form
          className="mt-7 grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={search}
        >
          <input
            aria-label={t("gymModule.keyword")}
            className={inputClassName}
            placeholder={t("gymModule.keyword")}
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value })
            }
          />
          <input
            aria-label={t("gymModule.city")}
            className={inputClassName}
            placeholder={t("gymModule.city")}
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
          <input
            aria-label={t("gymModule.district")}
            className={inputClassName}
            placeholder={t("gymModule.district")}
            value={filters.district}
            onChange={(e) =>
              setFilters({ ...filters, district: e.target.value })
            }
          />
          <input
            aria-label={t("gymModule.minimumRating")}
            className={inputClassName}
            min="0"
            max="5"
            step="0.5"
            placeholder={t("gymModule.minimumRating")}
            type="number"
            value={filters.minRating}
            onChange={(e) =>
              setFilters({ ...filters, minRating: e.target.value })
            }
          />
          <Button>
            <Search className="size-4" />
            {t("gymModule.search")}
          </Button>
        </form>
        <section className="mt-8">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState
              title={t("gymModule.loadError")}
              description={toErrorMessage(query.error)}
            />
          ) : query.data?.content?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {query.data.content.map((gym) => (
                <article
                  key={gym.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="grid h-36 place-items-center bg-zinc-900 text-lime-300">
                    <Building2 className="size-12" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-black">{gym.name}</h2>
                      <Badge>
                        {t(`statusLabels.${String(gym.status).toLowerCase()}`, {
                          defaultValue: gym.status,
                        })}
                      </Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm text-zinc-500">
                      <MapPin className="size-4" />
                      {gym.district}, {gym.city}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm">
                      {gym.description || t("common.noDescription")}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <Star className="size-4 fill-orange-400 text-orange-400" />
                        {gym.averageRating ?? 0}
                      </span>
                      <Link
                        className="font-black text-orange-600"
                        href={`/gyms/${gym.id}`}
                      >
                        {t("gymModule.viewGym")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("gymModule.noGyms")}
              description={t("gymModule.noGymsDescription")}
            />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}

export function GymPublicDetailPage({ gymId }: { gymId: number }) {
  const { t } = useTranslation();
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
            title={t("gymModule.notFound")}
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
            {t(`statusLabels.${String(gym.data.status).toLowerCase()}`, {
              defaultValue: gym.data.status,
            })}
          </Badge>
          <h1 className="mt-4 text-4xl font-black">{gym.data.name}</h1>
          <p className="mt-3 max-w-3xl text-zinc-300">{gym.data.description}</p>
          <p className="mt-5 flex items-center gap-2 font-bold">
            <MapPin className="size-5 text-lime-300" />
            {gym.data.address}, {gym.data.district}, {gym.data.city}
          </p>
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-black">
            {t("gymModule.branches")}
          </h2>
          {branches.data?.content?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {branches.data.content.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
                >
                  <h3 className="font-black">{branch.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    {branch.address}, {branch.district}
                  </p>
                  <p className="mt-3 text-sm font-bold">
                    {branch.phone || t("common.noPhone")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("gymModule.noBranches")}
              description={t("gymModule.noBranchesDescription")}
            />
          )}
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-black">
            {t("gymModule.facilities")}
          </h2>
          {facilities.data?.content?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.data.content.map((facility) => (
                <article
                  key={facility.id}
                  className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
                >
                  <div className="flex justify-between">
                    <h3 className="font-black">{facility.name}</h3>
                    <Badge>
                      {t(`gymModule.facilityTypes.${facility.type}`, {
                        defaultValue: facility.type,
                      })}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    {facility.description}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("gymModule.noFacilities")}
              description={t("gymModule.noFacilitiesDescription")}
            />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
