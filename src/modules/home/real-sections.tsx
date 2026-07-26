"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin } from "lucide-react";
import { marketplaceService } from "@/services/marketplace.service";
import { useTranslations } from "next-intl";

/** UC-074/009: phòng tập nổi bật lấy từ marketplace thật (thay dữ liệu mock). */
export function RealGymsSection() {
  const t = useTranslations();
  const query = useQuery({
    queryKey: ["home", "gyms"],
    queryFn: () => marketplaceService.searchGyms({ size: 6 }),
    staleTime: 5 * 60_000,
  });
  const gyms = query.data?.content ?? [];
  if (!query.isLoading && !gyms.length) return null;

  return (
    <section className="bg-muted/40 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{t("home.partnerGyms")}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("home.partnerGymsHint")}</p>
          </div>
          <Link href="/gyms" className="mt-3 flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:mt-0">{t("common.actions.viewAll")}<ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gyms.map((g) => (
            <Link key={g.id} href={`/gyms/${g.id}`} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="text-lg font-black text-foreground group-hover:text-primary">{g.gymName}</h3>
              {g.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{g.description}</p>}
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                {(g.city || g.address) && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{g.city ?? g.address}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** UC-014/009: PT nổi bật lấy từ marketplace thật. */
export function RealTrainersSection() {
  const t = useTranslations();
  const query = useQuery({
    queryKey: ["home", "pts"],
    queryFn: () => marketplaceService.searchPts({ size: 6 }),
    staleTime: 5 * 60_000,
  });
  const pts = query.data?.content ?? [];
  if (!query.isLoading && !pts.length) return null;

  return (
    <section className="bg-card py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{t("marketplace.trainers")}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("home.trainersHint")}</p>
          </div>
          <Link href="/trainers" className="mt-3 flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:mt-0">{t("common.actions.viewAll")}<ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pts.map((p) => (
            <Link key={p.id} href={`/trainers/${p.id}`} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="text-lg font-black text-foreground group-hover:text-primary">{p.displayName}</h3>
              {p.specialization && <p className="mt-1 text-sm text-muted-foreground">{p.specialization}</p>}
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                {p.experienceYears ? <span>{t("marketplace.yearsExperienceShort", { years: p.experienceYears })}</span> : null}
                {p.serviceArea ? <span className="flex items-center gap-1"><MapPin className="size-3.5" />{p.serviceArea}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
