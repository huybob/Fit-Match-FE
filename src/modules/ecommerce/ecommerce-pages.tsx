"use client";

import Link from "next/link";
import { ComponentType } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Dumbbell,
  Filter,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
} from "lucide-react";
import { appRoutes } from "@/constants/ecommerce.constant";
import {
  adminStats,
  bookings,
  gymPackages,
  trainers,
} from "@/data/mock-ecommerce.data";
import { useToast } from "@/lib/toast-provider";
import { useAuthStore } from "@/modules/auth/auth.store";
import { BookingForm } from "@/modules/forms/booking-form";
import {
  AdminPackageForm,
  AdminTrainerForm,
  CheckoutForm,
  ProfileForm,
} from "@/modules/forms/checkout-profile-admin-forms";
import { SiteLayout } from "@/modules/layout/site-layout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { DataTable, Pagination } from "@/shared/components/common/data-table";
import { EmptyState } from "@/shared/components/common/empty-state";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { GymPackage, Trainer } from "@/types/ecommerce.type";
import { formatCurrency } from "@/utils/format.util";

type ServiceCard = {
  titleKey: string;
  Icon: ComponentType<{ className?: string }>;
  descriptionKey: string;
};

function useCanBook() {
  const { user, status } = useAuthStore();
  return status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
}

const serviceCards: ServiceCard[] = [
  {
    titleKey: "home.smartBookingTitle",
    Icon: CalendarCheck,
    descriptionKey: "home.smartBookingDescription",
  },
  {
    titleKey: "home.marketplaceTitle",
    Icon: ShoppingCart,
    descriptionKey: "home.marketplaceDescription",
  },
  {
    titleKey: "home.memberTitle",
    Icon: ShieldCheck,
    descriptionKey: "home.memberDescription",
  },
];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <SiteLayout>
      <Hero />
      <Section
        eyebrow={t("home.servicesTitle")}
        title={t("home.offerTitle")}
        description={t("home.offerDescription")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {serviceCards.map(({ titleKey, Icon, descriptionKey }) => (
            <Card
              key={titleKey}
              className="fit-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-orange-100 text-[#ff6b22] transition-transform duration-300 group-hover:scale-105 dark:bg-orange-950/40">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-black">{t(titleKey)}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {t(descriptionKey)}
              </p>
            </Card>
          ))}
        </div>
      </Section>
      <Section eyebrow={t("home.featuredPackages")} title={t("packages.title")}>
        <PackageGrid packages={gymPackages.slice(0, 3)} />
      </Section>
      <Section eyebrow={t("home.featuredTrainers")} title={t("trainers.title")}>
        <TrainerGrid trainers={trainers.slice(0, 3)} />
      </Section>
      <Section eyebrow={t("home.reviews")} title={t("home.reviewsTitle")}>
        <div className="grid gap-4 md:grid-cols-3">
          {["home.reviewOne", "home.reviewTwo", "home.reviewThree"].map(
            (review) => (
              <Card key={review} className="fit-card p-6">
                <div className="flex gap-1 text-orange-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {t(review)}
                </p>
              </Card>
            ),
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}

function Hero() {
  const { t } = useTranslation();
  const canBook = useCanBook();

  return (
    <section className="relative overflow-hidden border-b border-[#dedfce] bg-[#10130f] text-white dark:border-white/10">
      <div className="absolute -left-32 top-0 size-96 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.85fr] lg:px-8 lg:py-24">
        <div>
          <Badge className="border-[#a3ff12]/40 bg-[#a3ff12]/10 text-[#a3ff12]">
            {t("home.heroBadge")}
          </Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d8dcc6]">
            {t("home.heroDesc")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {canBook && (
              <Link
                className="fit-cta inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black shadow-lg shadow-lime-500/15 transition hover:-translate-y-0.5"
                href={appRoutes.booking}
              >
                {t("home.cta")}
                <ArrowRight className="size-4" />
              </Link>
            )}
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              href={appRoutes.packages}
            >
              {t("home.secondary")}
            </Link>
          </div>
        </div>
        <Card className="border-white/10 bg-white/[0.07] p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-lime-300/30 hover:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold">{booking.type}</p>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-2 text-sm text-[#d8dcc6]">
                  {booking.trainerName} · {booking.date} · {booking.time}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

export function PackagesPage() {
  const { t } = useTranslation();
  const [type, setType] = useState("all");
  const packages = useMemo(
    () =>
      type === "all"
        ? gymPackages
        : gymPackages.filter((item) => item.type === type),
    [type],
  );

  return (
    <SiteLayout>
      <PageShell
        title={t("packages.title")}
        description={t("packages.description")}
      >
        <FilterBar
          value={type}
          onChange={setType}
          options={["all", "membership", "pt", "class"]}
        />
        <PackageGrid packages={packages} />
        <Pagination />
      </PageShell>
    </SiteLayout>
  );
}

export function PackageDetailPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const item = gymPackages.find((pack) => pack.id === id) ?? gymPackages[0];

  return (
    <SiteLayout>
      <PageShell title={item.name} description={item.description}>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
          <Card className="fit-card p-6">
            <h2 className="text-2xl font-black">{t("packages.detail")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {item.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-md bg-[#f1f2e8] p-4 dark:bg-black/20"
                >
                  <Check className="size-4 text-[#ff6b22]" />
                  <span className="text-sm font-bold">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
          <PackageCard item={item} />
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function TrainersPage() {
  const { t } = useTranslation();
  const [gender, setGender] = useState("all");
  const filtered =
    gender === "all"
      ? trainers
      : trainers.filter((trainer) => trainer.gender === gender);

  return (
    <SiteLayout>
      <PageShell
        title={t("trainers.title")}
        description={t("trainers.description")}
      >
        <FilterBar
          value={gender}
          onChange={setGender}
          options={["all", "male", "female"]}
        />
        <TrainerGrid trainers={filtered} />
        <Pagination />
      </PageShell>
    </SiteLayout>
  );
}

export function TrainerDetailPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const canBook = useCanBook();
  const trainer = trainers.find((item) => item.id === id) ?? trainers[0];

  return (
    <SiteLayout>
      <PageShell title={trainer.name} description={trainer.bio}>
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <TrainerCard trainer={trainer} />
          <Card className="fit-card p-6">
            <h2 className="text-xl font-black">{t("trainers.available")}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {trainer.availableSlots.map((slot) =>
                canBook ? (
                  <Link
                    key={slot}
                    href={appRoutes.booking}
                    className="rounded-md border border-zinc-200 p-4 text-center font-bold hover:border-emerald-500 dark:border-zinc-800"
                  >
                    {slot}
                  </Link>
                ) : (
                  <div
                    key={slot}
                    className="rounded-md border border-zinc-200 p-4 text-center font-bold text-zinc-500 dark:border-zinc-800"
                  >
                    {slot}
                  </div>
                ),
              )}
            </div>
          </Card>
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function BookingPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell
        title={t("booking.title")}
        description={t("booking.description")}
      >
        <Card className="fit-card p-6">
          <BookingForm />
        </Card>
      </PageShell>
    </SiteLayout>
  );
}

export function CartPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState(gymPackages.slice(0, 2));

  return (
    <SiteLayout>
      <PageShell title={t("checkout.cartTitle")}>
        {items.length === 0 ? (
          <EmptyState
            title={t("checkout.empty")}
            description={t("checkout.emptyDescription")}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="fit-card flex items-center justify-between gap-4 p-4"
                >
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-sm text-zinc-500">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <Button
                    className="bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50 dark:bg-zinc-950 dark:ring-zinc-800"
                    onClick={() => {
                      setItems((value) =>
                        value.filter((next) => next.id !== item.id),
                      );
                      toast({
                        type: "warning",
                        title: t("common.warning"),
                        description: item.name,
                      });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Card>
              ))}
            </div>
            <CheckoutSummary
              total={items.reduce((sum, item) => sum + item.price, 0)}
            />
          </div>
        )}
      </PageShell>
    </SiteLayout>
  );
}

export function CheckoutPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("checkout.checkoutTitle")}>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
          <Card className="fit-card p-6">
            <CheckoutForm />
          </Card>
          <CheckoutSummary total={gymPackages[1].price} />
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function CheckoutSuccessPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("checkout.successTitle")}>
        <Card className="fit-card p-10 text-center">
          <PackageCheck className="mx-auto size-14 text-[#a3ff12]" />
          <p className="mt-5 text-xl font-black">{t("checkout.success")}</p>
          <Link
            className="fit-cta mt-6 inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-bold"
            href="/profile/bookings"
          >
            {t("booking.history")}
          </Link>
        </Card>
      </PageShell>
    </SiteLayout>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("profile.title")}>
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <Card className="fit-card p-6">
            <ProfileForm />
          </Card>
          <Card className="fit-card p-6">
            <h2 className="text-xl font-black">
              {t("profile.activePackages")}
            </h2>
            <PackageGrid packages={gymPackages.slice(0, 2)} compact />
          </Card>
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function ProfileBookingsPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("profile.bookings")}>
        <BookingTable />
      </PageShell>
    </SiteLayout>
  );
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("admin.title")}>
        <div className="grid gap-4 md:grid-cols-4">
          {adminStats.map(([label, value, growth]) => (
            <Card key={label} className="fit-card p-5">
              <p className="text-sm font-bold text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
              <p className="mt-2 text-sm font-bold text-[#ff6b22]">{growth}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BookingTable />
          <Card className="fit-card p-6">
            <h2 className="text-xl font-black">{t("admin.createPackage")}</h2>
            <div className="mt-5">
              <AdminPackageForm />
            </div>
          </Card>
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function AdminPackagesPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("admin.packages")}>
        <Card className="fit-card p-6">
          <AdminPackageForm />
        </Card>
        <div className="mt-6">
          <DataTable
            columns={[
              t("common.name"),
              t("common.type"),
              t("common.price"),
              t("common.actions"),
            ]}
            rows={gymPackages.map((item) => [
              item.name,
              item.type,
              formatCurrency(item.price),
              <AdminActions key={item.id} />,
            ])}
          />
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function AdminTrainersPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("admin.trainers")}>
        <Card className="fit-card p-6">
          <AdminTrainerForm />
        </Card>
        <div className="mt-6">
          <DataTable
            columns={[
              t("common.name"),
              t("common.specialty"),
              t("common.price"),
              t("common.actions"),
            ]}
            rows={trainers.map((trainer) => [
              trainer.name,
              trainer.specialty,
              formatCurrency(trainer.price),
              <AdminActions key={trainer.id} />,
            ])}
          />
        </div>
      </PageShell>
    </SiteLayout>
  );
}

export function AdminBookingsPage() {
  const { t } = useTranslation();
  return (
    <SiteLayout>
      <PageShell title={t("admin.bookings")}>
        <BookingTable admin />
      </PageShell>
    </SiteLayout>
  );
}

function PackageGrid({
  packages,
  compact = false,
}: {
  packages: GymPackage[];
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? "mt-5 grid gap-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      }
    >
      {packages.map((item) => (
        <PackageCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function PackageCard({ item }: { item: GymPackage }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const canBook = useCanBook();

  return (
    <Card className="fit-card group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-lime-300 via-lime-400 to-orange-400 opacity-0 transition-opacity group-hover:opacity-100" />
      {item.popular && (
        <Badge className="absolute right-5 top-5 border-[#a3ff12]/50 bg-[#a3ff12]/20 text-[#4d7600] dark:text-[#a3ff12]">
          {t("common.popular")}
        </Badge>
      )}
      <div className="grid size-12 place-items-center rounded-2xl bg-orange-100 text-[#ff6b22] dark:bg-orange-950/40">
        <Dumbbell className="size-6" />
      </div>
      <h3 className="mt-5 text-xl font-black">{item.name}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
      <p className="mt-5 text-3xl font-black">{formatCurrency(item.price)}</p>
      <div className="mt-auto flex gap-2 pt-6">
        <Link
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-200 text-sm font-bold transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
          href={`/packages/${item.id}`}
        >
          {t("common.viewDetails")}
        </Link>
        {canBook && (
          <Button
            onClick={() =>
              toast({
                type: "success",
                title: t("packages.added"),
                description: item.name,
              })
            }
            className="fit-cta h-10 flex-1"
          >
            {t("common.addToCart")}
          </Button>
        )}
      </div>
    </Card>
  );
}

function TrainerGrid({ trainers }: { trainers: Trainer[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trainers.map((trainer) => (
        <TrainerCard key={trainer.id} trainer={trainer} />
      ))}
    </div>
  );
}

function TrainerCard({ trainer }: { trainer: Trainer }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const canBook = useCanBook();

  return (
    <Card className="fit-card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#10130f] text-xl font-black text-[#a3ff12] shadow-lg shadow-zinc-950/10 transition-transform group-hover:scale-105 dark:bg-[#a3ff12] dark:text-[#10130f]">
        {trainer.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)}
      </div>
      <h3 className="mt-5 text-xl font-black">{trainer.name}</h3>
      <p className="mt-1 text-sm font-semibold text-zinc-500">
        {trainer.specialty}
      </p>
      <div className="mt-3 flex items-center gap-2 text-sm font-bold">
        <Star className="size-4 fill-orange-400 text-orange-400" />
        {trainer.rating} ·{" "}
        {t("common.reviewsCount", { count: trainer.reviews })}
      </div>
      <p className="mt-4 text-lg font-black">{formatCurrency(trainer.price)}</p>
      <div className="mt-auto flex gap-2 pt-6">
        <Link
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-200 text-sm font-bold transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
          href={`/trainers/${trainer.id}`}
        >
          {t("common.viewDetails")}
        </Link>
        {canBook && (
          <Button
            className="fit-cta h-10 flex-1"
            onClick={() =>
              toast({
                type: "success",
                title: t("trainers.booked"),
                description: trainer.name,
              })
            }
          >
            {t("common.bookNow")}
          </Button>
        )}
      </div>
    </Card>
  );
}

function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#dedfce]/80 bg-white/70 px-6 py-7 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] sm:px-8">
        <div className="absolute -right-12 -top-16 size-40 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="relative">
          <div className="mb-4 h-1 w-12 rounded-full bg-[#ff6b22]" />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-3xl leading-7 text-zinc-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </main>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b22]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
      {description && (
        <p className="mt-3 max-w-3xl text-zinc-500">{description}</p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function FilterBar({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const { t } = useTranslation();

  return (
    <Card className="fit-card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm font-black">
        <Filter className="size-4" />
        {t("packages.filter")}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-48 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-300/20 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {t(
              option === "all"
                ? "common.all"
                : option === "male" || option === "female"
                  ? `common.${option}`
                  : `packages.${option}`,
            )}
          </option>
        ))}
      </select>
    </Card>
  );
}

function BookingTable({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  return (
    <DataTable
      columns={[
        "ID",
        t("booking.trainer"),
        t("booking.date"),
        t("booking.status"),
        t("common.actions"),
      ]}
      rows={bookings.map((booking) => [
        booking.id,
        booking.trainerName,
        `${booking.date} ${booking.time}`,
        <StatusBadge key={booking.id} status={booking.status} />,
        admin ? (
          <AdminActions key={booking.id} />
        ) : (
          <Button
            key={booking.id}
            className="bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50 dark:bg-zinc-950 dark:ring-zinc-800"
            onClick={() =>
              toast({
                type: "warning",
                title: t("booking.cancelled"),
                description: booking.id,
              })
            }
          >
            {t("common.cancel")}
          </Button>
        ),
      ])}
    />
  );
}

function CheckoutSummary({ total }: { total: number }) {
  const { t } = useTranslation();

  return (
    <Card className="fit-card h-fit p-6">
      <p className="text-sm font-bold text-zinc-500">{t("common.checkout")}</p>
      <p className="mt-3 text-3xl font-black">{formatCurrency(total)}</p>
      <Link
        className="fit-cta mt-6 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-black"
        href={appRoutes.checkout}
      >
        {t("common.checkout")}
      </Link>
    </Card>
  );
}

function AdminActions() {
  const { t } = useTranslation();
  const { toast } = useToast();

  return (
    <div className="flex gap-2">
      <Button
        className="bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-white dark:ring-zinc-800"
        onClick={() => toast({ type: "success", title: t("admin.saved") })}
      >
        {t("common.edit")}
      </Button>
      <ConfirmDialog
        label={t("common.delete")}
        title={t("admin.deleted")}
        onConfirm={() => toast({ type: "error", title: t("admin.deleted") })}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const tone =
    status === "confirmed" || status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-orange-50 text-orange-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>
      {t(`statusLabels.${status}`, { defaultValue: status })}
    </span>
  );
}
