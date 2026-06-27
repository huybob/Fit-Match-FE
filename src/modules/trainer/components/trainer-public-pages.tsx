"use client";

import { Award, CalendarDays, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SiteLayout } from "@/modules/layout/site-layout";
import {
  useGetPublicTrainer,
  useGetPublicTrainerAvailability,
  useGetPublicTrainerCertificates,
  useGetPublicTrainerServices,
} from "@/modules/trainer/hooks/use-trainer";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/common/empty-state";
import { Input } from "@/shared/components/ui/input";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
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

const DAY_LABELS: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

export function TrainersDirectoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = Number(userId);
    if (Number.isInteger(id) && id > 0) router.push(`/trainers/${id}`);
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm font-black uppercase tracking-widest text-accent">
          Khám phá huấn luyện viên
        </p>
        <h1 className="mt-3 text-4xl font-black">
          Danh sách huấn luyện viên
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          So sánh PT theo chuyên môn, kinh nghiệm, đánh giá và giá mỗi buổi.
        </p>
        <form
          className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row"
          onSubmit={submit}
        >
          <Input
            aria-label="Mã huấn luyện viên"
            className="flex-1"
            inputMode="numeric"
            min="1"
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Mã huấn luyện viên"
            required
            type="number"
            value={userId}
          />
          <Button className="shrink-0" type="submit">
            <Search className="size-4" />
            Xem huấn luyện viên
          </Button>
        </form>
      </main>
    </SiteLayout>
  );
}

export function TrainerPublicDetailPage({ userId }: { userId: number }) {
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
            title="Không tìm thấy huấn luyện viên"
            description={toErrorMessage(profileQuery.error)}
          />
        </main>
      </SiteLayout>
    );

  const profile = profileQuery.data;
  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950 p-6 text-white shadow-xl shadow-zinc-950/10 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-24 place-items-center rounded-full bg-primary text-3xl font-black text-zinc-950">
              <UserRound className="size-10" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">
                Huấn luyện viên #{profile.userId}
              </p>
              <h1 className="mt-1 text-3xl font-black">{profile.username}</h1>
              <p className="mt-2 text-zinc-300">
                {profile.bio || "Chưa có mô tả"}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                <span>
                  {profile.experienceYears ?? 0} năm kinh nghiệm
                </span>
                {profile.pricePerSession && (
                  <span>
                    {currency.format(profile.pricePerSession)} / buổi
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-black">
            Dịch vụ
          </h2>
          {servicesQuery.isLoading ? (
            <LoadingSkeleton />
          ) : servicesQuery.data?.content?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {servicesQuery.data.content.map((service) => (
                <article
                  key={service.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h3 className="font-black">{service.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                  <p className="mt-4 font-black text-accent">
                    {currency.format(service.price ?? 0)} ·{" "}
                    {service.durationMinutes} phút
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có dịch vụ"
              description="Huấn luyện viên này chưa có dịch vụ nào."
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
            <CalendarDays className="size-6" />
            Lịch trống
          </h2>
          {availabilityQuery.data?.content?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availabilityQuery.data.content.map((slot) => (
                <article
                  key={slot.id}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="font-black">
                    {DAY_LABELS[slot.dayOfWeek ?? 0] ?? `Ngày ${slot.dayOfWeek}`}
                  </p>
                  <p className="mt-1 text-sm">
                    {timeLabel(slot.startTime)}–{timeLabel(slot.endTime)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có lịch trống"
              description="Huấn luyện viên này chưa cập nhật lịch trống."
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
            <Award className="size-6" />
            Chứng chỉ
          </h2>
          {certificatesQuery.data?.content?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {certificatesQuery.data.content.map((cert) => (
                <article
                  key={cert.id}
                  className="rounded-xl border border-border p-5"
                >
                  <h3 className="font-black">{cert.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cert.issuingOrg}
                  </p>
                  <p className="mt-3 text-xs font-bold">
                    {cert.issueDate || "Chưa có ngày cấp"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có chứng chỉ"
              description="Huấn luyện viên này chưa có chứng chỉ nào."
            />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
