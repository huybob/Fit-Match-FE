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
import { adminStats, bookings, gymPackages, trainers } from "@/data/mock-ecommerce.data";
import { useToast } from "@/lib/toast-provider";
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
  title: string;
  Icon: ComponentType<{ className?: string }>;
  description: string;
};

const serviceCards: ServiceCard[] = [
  {
    title: "Smart booking",
    Icon: CalendarCheck,
    description: "Choose trainer, date, time and session type.",
  },
  {
    title: "Fitness ecommerce",
    Icon: ShoppingCart,
    description: "Add gym packages to cart and mock checkout.",
  },
  {
    title: "Member profile",
    Icon: ShieldCheck,
    description: "Track bookings, active packages and profile updates.",
  },
];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <SiteLayout>
      <Hero />
      <Section
        eyebrow={t("home.servicesTitle")}
        title="Gym memberships, PT coaching, group classes"
        description="A polished ecommerce journey for discovering packages, trainers, booking sessions and checking out."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {serviceCards.map(({ title, Icon, description }) => (
            <Card key={title} className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <Icon className="size-8 text-emerald-500" />
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
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
      <Section eyebrow={t("home.reviews")} title="Trusted by busy professionals">
        <div className="grid gap-4 md:grid-cols-3">
          {["Great PT matching", "Booking is so fast", "Checkout feels premium"].map((review) => (
            <Card key={review} className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-1 text-orange-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {review}. The interface makes it simple to compare trainers, packages and booking times.
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </SiteLayout>
  );
}

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
        <div>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Gym / Fitness / Personal Trainer
          </Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            {t("home.heroDesc")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 text-sm font-black text-zinc-950 hover:bg-emerald-400" href={appRoutes.booking}>
              {t("home.cta")}
              <ArrowRight className="size-4" />
            </Link>
            <Link className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 px-6 text-sm font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900" href={appRoutes.packages}>
              {t("home.secondary")}
            </Link>
          </div>
        </div>
        <Card className="p-5 shadow-2xl shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{booking.type}</p>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-2 text-sm text-zinc-500">
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
    () => (type === "all" ? gymPackages : gymPackages.filter((item) => item.type === type)),
    [type],
  );

  return (
    <SiteLayout>
      <PageShell title={t("packages.title")} description="Filter by price, duration and package type.">
        <FilterBar value={type} onChange={setType} options={["all", "membership", "pt", "class"]} />
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
          <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-black">{t("packages.detail")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {item.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-950">
                  <Check className="size-4 text-emerald-500" />
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
  const filtered = gender === "all" ? trainers : trainers.filter((trainer) => trainer.gender === gender);

  return (
    <SiteLayout>
      <PageShell title={t("trainers.title")} description="Filter by specialty, gender, experience and price.">
        <FilterBar value={gender} onChange={setGender} options={["all", "male", "female"]} />
        <TrainerGrid trainers={filtered} />
        <Pagination />
      </PageShell>
    </SiteLayout>
  );
}

export function TrainerDetailPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const trainer = trainers.find((item) => item.id === id) ?? trainers[0];

  return (
    <SiteLayout>
      <PageShell title={trainer.name} description={trainer.bio}>
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <TrainerCard trainer={trainer} />
          <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-black">{t("trainers.available")}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {trainer.availableSlots.map((slot) => (
                <Link key={slot} href={appRoutes.booking} className="rounded-md border border-zinc-200 p-4 text-center font-bold hover:border-emerald-500 dark:border-zinc-800">
                  {slot}
                </Link>
              ))}
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
      <PageShell title={t("booking.title")} description="Choose trainer, date, time, session type and customer information.">
        <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
          <EmptyState title={t("checkout.empty")} description="Browse packages and add one to continue." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="flex items-center justify-between gap-4 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-sm text-zinc-500">{formatCurrency(item.price)}</p>
                  </div>
                  <Button
                    className="bg-white text-red-600 ring-1 ring-zinc-200 hover:bg-red-50 dark:bg-zinc-950 dark:ring-zinc-800"
                    onClick={() => {
                      setItems((value) => value.filter((next) => next.id !== item.id));
                      toast({ type: "warning", title: t("common.warning"), description: item.name });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Card>
              ))}
            </div>
            <CheckoutSummary total={items.reduce((sum, item) => sum + item.price, 0)} />
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
          <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
        <Card className="p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <PackageCheck className="mx-auto size-14 text-emerald-500" />
          <p className="mt-5 text-xl font-black">{t("checkout.success")}</p>
          <Link className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white dark:bg-white dark:text-zinc-950" href="/profile/bookings">
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
          <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <ProfileForm />
          </Card>
          <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-black">{t("profile.activePackages")}</h2>
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
            <Card key={label} className="p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-bold text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
              <p className="mt-2 text-sm font-bold text-emerald-500">{growth}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BookingTable />
          <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
        <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <AdminPackageForm />
        </Card>
        <div className="mt-6">
          <DataTable
            columns={["Name", "Type", "Price", "Actions"]}
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
        <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <AdminTrainerForm />
        </Card>
        <div className="mt-6">
          <DataTable
            columns={["Name", "Specialty", "Price", "Actions"]}
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

function PackageGrid({ packages, compact = false }: { packages: GymPackage[]; compact?: boolean }) {
  return (
    <div className={compact ? "mt-5 grid gap-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
      {packages.map((item) => (
        <PackageCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function PackageCard({ item }: { item: GymPackage }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  return (
    <Card className="relative p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {item.popular && <Badge className="absolute right-5 top-5 border-emerald-200 bg-emerald-50 text-emerald-700">Popular</Badge>}
      <Dumbbell className="size-8 text-emerald-500" />
      <h3 className="mt-5 text-xl font-black">{item.name}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
      <p className="mt-5 text-3xl font-black">{formatCurrency(item.price)}</p>
      <div className="mt-5 flex gap-2">
        <Link className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-zinc-200 text-sm font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950" href={`/packages/${item.id}`}>
          {t("common.viewDetails")}
        </Link>
        <Button
          onClick={() => toast({ type: "success", title: t("packages.added"), description: item.name })}
          className="h-10 flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          {t("common.addToCart")}
        </Button>
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

  return (
    <Card className="p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex size-16 items-center justify-center rounded-lg bg-zinc-950 text-xl font-black text-white dark:bg-white dark:text-zinc-950">
        {trainer.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
      </div>
      <h3 className="mt-5 text-xl font-black">{trainer.name}</h3>
      <p className="mt-1 text-sm font-semibold text-zinc-500">{trainer.specialty}</p>
      <div className="mt-3 flex items-center gap-2 text-sm font-bold">
        <Star className="size-4 fill-orange-400 text-orange-400" />
        {trainer.rating} · {trainer.reviews} reviews
      </div>
      <p className="mt-4 text-lg font-black">{formatCurrency(trainer.price)}</p>
      <div className="mt-5 flex gap-2">
        <Link className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-zinc-200 text-sm font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950" href={`/trainers/${trainer.id}`}>
          {t("common.viewDetails")}
        </Link>
        <Button
          className="h-10 flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          onClick={() => toast({ type: "success", title: t("trainers.booked"), description: trainer.name })}
        >
          {t("common.bookNow")}
        </Button>
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-zinc-500">{description}</p>}
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
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase text-emerald-600">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
      {description && <p className="mt-3 max-w-3xl text-zinc-500">{description}</p>}
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
    <Card className="mb-6 flex flex-col gap-3 p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm font-black">
        <Filter className="size-4" />
        {t("packages.filter")}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
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
      columns={["ID", t("booking.trainer"), t("booking.date"), t("booking.status"), "Actions"]}
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
            onClick={() => toast({ type: "warning", title: t("booking.cancelled"), description: booking.id })}
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
    <Card className="h-fit p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-bold text-zinc-500">{t("common.checkout")}</p>
      <p className="mt-3 text-3xl font-black">{formatCurrency(total)}</p>
      <Link className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 text-sm font-black text-zinc-950 hover:bg-emerald-400" href={appRoutes.checkout}>
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
  const tone =
    status === "confirmed" || status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-orange-50 text-orange-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{status}</span>;
}
