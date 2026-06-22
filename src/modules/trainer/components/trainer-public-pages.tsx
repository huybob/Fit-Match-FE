"use client";

import { Award, CalendarDays, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { SiteLayout } from "@/modules/layout/site-layout";
import {
  useGetPublicTrainer,
  useGetPublicTrainerAvailability,
  useGetPublicTrainerCertificates,
  useGetPublicTrainerServices,
} from "@/modules/trainer/hooks/use-trainer";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { inputClassName } from "@/modules/forms/form-controls";
import { toErrorMessage } from "@/shared/utils/error.util";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function timeLabel(value?: string | { hour?: number; minute?: number }) {
  if (!value) return "--:--";
  if (typeof value === "string") return value.slice(0, 5);
  return `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}`;
}

export function TrainersDirectoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const { t } = useTranslation();

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = Number(userId);
    if (Number.isInteger(id) && id > 0) router.push(`/trainers/${id}`);
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm font-black uppercase tracking-widest text-orange-600">
          {t("trainerModule.directoryEyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-black">
          {t("trainerModule.directoryTitle")}
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">
          {t("trainerModule.directoryDescription")}
        </p>
        <form
          className="mt-8 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row"
          onSubmit={submit}
        >
          <input
            aria-label={t("trainerModule.userId")}
            className={inputClassName}
            inputMode="numeric"
            min="1"
            onChange={(event) => setUserId(event.target.value)}
            placeholder={t("trainerModule.userId")}
            required
            type="number"
            value={userId}
          />
          <Button className="shrink-0" type="submit">
            <Search className="size-4" />
            {t("trainerModule.viewTrainer")}
          </Button>
        </form>
      </main>
    </SiteLayout>
  );
}

export function TrainerPublicDetailPage({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const profileQuery = useGetPublicTrainer(userId);
  const profileId = profileQuery.data?.id ?? 0;
  const servicesQuery = useGetPublicTrainerServices(profileId);
  const availabilityQuery = useGetPublicTrainerAvailability(profileId);
  const certificatesQuery = useGetPublicTrainerCertificates(profileId);

  if (profileQuery.isLoading)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-6xl px-4 py-12">
          <LoadingSkeleton />
        </main>
      </SiteLayout>
    );
  if (profileQuery.isError || !profileQuery.data)
    return (
      <SiteLayout>
        <main className="mx-auto max-w-4xl px-4 py-12">
          <EmptyState
            title={t("trainerModule.notFound")}
            description={toErrorMessage(profileQuery.error)}
          />
        </main>
      </SiteLayout>
    );

  const profile = profileQuery.data;
  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <section className="rounded-2xl bg-zinc-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-24 place-items-center rounded-full bg-lime-300 text-3xl font-black text-zinc-950">
              <UserRound className="size-10" />
            </div>
            <div>
              <p className="text-sm font-bold text-lime-300">
                {t("trainerModule.trainerNumber", { id: profile.userId })}
              </p>
              <h1 className="mt-1 text-3xl font-black">{profile.username}</h1>
              <p className="mt-2 text-zinc-300">
                {profile.bio || t("trainerModule.emptyBio")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                <span>
                  {t("trainerModule.experience", {
                    count: profile.experienceYears ?? 0,
                  })}
                </span>
                {profile.pricePerSession && (
                  <span>
                    {currency.format(profile.pricePerSession)} /{" "}
                    {t("trainerModule.perSession")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-black">
            {t("trainerModule.services")}
          </h2>
          {servicesQuery.isLoading ? (
            <LoadingSkeleton />
          ) : servicesQuery.data?.content?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {servicesQuery.data.content.map((service) => (
                <article
                  key={service.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h3 className="font-black">{service.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    {service.description}
                  </p>
                  <p className="mt-4 font-black text-orange-600">
                    {currency.format(service.price ?? 0)} ·{" "}
                    {service.durationMinutes} min
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("trainerModule.noServices")}
              description={t("trainerModule.noServicesDescription")}
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
            <CalendarDays className="size-6" />
            {t("trainerModule.availability")}
          </h2>
          {availabilityQuery.data?.content?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availabilityQuery.data.content.map((slot) => (
                <article
                  key={slot.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <p className="font-black">
                    {t(`trainerModule.days.${slot.dayOfWeek ?? 0}`)}
                  </p>
                  <p className="mt-1 text-sm">
                    {timeLabel(slot.startTime)}–{timeLabel(slot.endTime)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("trainerModule.noAvailability")}
              description={t("trainerModule.noAvailabilityDescription")}
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
            <Award className="size-6" />
            {t("trainerModule.certificates")}
          </h2>
          {certificatesQuery.data?.content?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {certificatesQuery.data.content.map((cert) => (
                <article
                  key={cert.id}
                  className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
                >
                  <h3 className="font-black">{cert.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {cert.issuingOrg}
                  </p>
                  <p className="mt-3 text-xs font-bold">
                    {cert.issueDate || t("trainerModule.issueDateMissing")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("trainerModule.noCertificates")}
              description={t("trainerModule.noCertificatesDescription")}
            />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
