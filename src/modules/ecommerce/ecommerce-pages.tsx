"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  Dumbbell,
  Filter,
  Heart,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Star,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";
import { appRoutes } from "@/constants/ecommerce.constant";
import {
  adminStats,
  blogPosts,
  bookings,
  gymPackages,
  gyms,
  testimonials,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { DataTable, Pagination } from "@/shared/components/common/data-table";
import { EmptyState } from "@/shared/components/common/empty-state";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { BlogPost, Gym, GymPackage, Testimonial, Trainer } from "@/types/ecommerce.type";
import { formatCurrency } from "@/utils/format.util";

function useCanBook() {
  const { user, status } = useAuthStore();
  return status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
}

export function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <StatsStrip />
      <TrainerSection />
      <GymSection />
      <TestimonialsSection />
      <BlogSection />
    </SiteLayout>
  );
}

/* ─── Hero ─────────────────────────────────────────────────── */

function Hero() {
  const { t } = useTranslation();
  const canBook = useCanBook();

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0a0f1a]">
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-50/60 to-transparent dark:from-blue-950/10 pointer-events-none" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        {/* Left */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-[#2563EB] dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
            Nền tảng Thể thao Đẳng cấp Thế giới
          </span>
          <h1 className="mt-5 max-w-lg text-5xl font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Nâng tầm Hiệu suất cùng{" "}
            <span className="text-[#2563EB]">Chuyên gia Hàng đầu</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-gray-500 dark:text-gray-400">
            Kết nối với các huấn luyện viên cá nhân được xác thực và phòng gym
            cao cấp phù hợp với hành trình thể hình của bạn. Đặt lịch trực
            tuyến, theo dõi hiệu suất và hỗ trợ cộng đồng trong một hệ sinh
            thái duy nhất.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {canBook && (
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
                href={appRoutes.trainers}
              >
                <Users className="size-4" />
                Tìm PT
              </Link>
            )}
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              href={appRoutes.gyms}
            >
              Tìm Phòng tập
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Right: hero image area */}
        <div className="relative hidden lg:block">
          <div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1c35] via-[#1a3060] to-[#2563EB] shadow-2xl shadow-blue-900/30"
            style={{ aspectRatio: "4/5" }}
          >
            {/* Athlete silhouette placeholder */}
            <div className="absolute inset-0 flex items-end justify-center">
              <div className="h-4/5 w-3/5 rounded-t-full bg-gradient-to-t from-gray-800/80 to-gray-600/40 opacity-70" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
              <Dumbbell className="size-56 text-white" />
            </div>

            {/* Floating progress card */}
            <div className="absolute bottom-6 left-5 right-5 rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur dark:bg-gray-900/95">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Tiến Độ Trung Bình
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
                  <TrendingUp className="size-4 text-green-600" />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  +42% Khối lượng cơ
                </p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#2563EB] to-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats strip ────────────────────────────────────────────── */

const heroStats = [
  { value: "1,200+", label: "Chuyên gia Huấn luyện" },
  { value: "450+", label: "Phòng tập Đối tác" },
  { value: "85k+", label: "Lượt đặt lịch thành công" },
  { value: "98%", label: "Tỷ lệ khách hàng hài lòng" },
];

function StatsStrip() {
  return (
    <div className="border-y border-gray-100 bg-white dark:border-white/10 dark:bg-[#0a0f1a]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 px-4 sm:px-6 lg:grid-cols-4 lg:px-8 dark:divide-white/10">
        {heroStats.map(({ value, label }) => (
          <div key={label} className="px-6 py-8 text-center lg:text-left">
            <p className="text-3xl font-black text-[#2563EB]">{value}</p>
            <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Trainer section ────────────────────────────────────────── */

function TrainerSection() {
  return (
    <section className="bg-white py-16 dark:bg-[#0a0f1a] lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Huấn luyện viên cá nhân Ưu tú
            </h2>
            <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              Làm việc với những người giỏi nhất trong ngành. Chuyên gia có
              chứng chỉ sẵn sàng cá nhân hóa kế hoạch của bạn.
            </p>
          </div>
          <Link
            href={appRoutes.trainers}
            className="mt-3 flex shrink-0 items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline sm:mt-0"
          >
            Xem tất cả HLV
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Gym section ────────────────────────────────────────────── */

function GymSection() {
  return (
    <section className="bg-gray-50 py-16 dark:bg-[#060c18] lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Phòng tập &amp; Studio Đối tác
            </h2>
            <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              Cơ sở vật chất cao cấp được trang bị công nghệ mới nhất và thiết
              bị hàng đầu.
            </p>
          </div>
          <Link
            href={appRoutes.gyms}
            className="mt-3 flex shrink-0 items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline sm:mt-0"
          >
            Khám phá thêm Phòng tập
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gyms.map((gym) => (
            <GymCard key={gym.id} gym={gym} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GymCard({ gym }: { gym: Gym }) {
  const canBook = useCanBook();

  return (
    <Card className="overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image area */}
      <div
        className={`relative h-48 bg-gradient-to-br ${gym.gradient}`}
      >
        {/* Gym equipment pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Dumbbell className="size-24 text-white" />
        </div>
        {gym.badge && (
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-gray-800 shadow backdrop-blur-sm">
            <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
            {gym.badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-black text-gray-900 dark:text-white">{gym.name}</h3>
        <div className="mt-1.5 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="size-3.5 shrink-0" />
          {gym.location}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {gym.facilities.map((f) => (
            <span
              key={f}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300"
            >
              {f}
            </span>
          ))}
        </div>
        {canBook && (
          <Link
            href={appRoutes.booking}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-black text-white transition hover:bg-[#1D4ED8]"
          >
            Đặt vé ngay
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </Card>
  );
}

/* ─── Testimonials ────────────────────────────────────────────── */

function TestimonialsSection() {
  return (
    <section className="bg-white py-16 dark:bg-[#0a0f1a] lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Được tin dùng bởi những người dẫn đầu
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            Tham gia cộng đồng hàng nghìn chuyên gia và vận động viên đã thay
            đổi cuộc sống thông qua FitMatch.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm leading-7 text-gray-600 dark:text-gray-300">
        {testimonial.quote}
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-sm font-black text-white">
          {testimonial.initials}
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {testimonial.name}
          </p>
          <p className="text-xs text-gray-500">{testimonial.title}</p>
        </div>
        <p className="ml-auto text-xs text-gray-400">{testimonial.date}</p>
      </div>
    </Card>
  );
}

/* ─── Blog section ───────────────────────────────────────────── */

function BlogSection() {
  return (
    <section className="bg-gray-50 py-16 dark:bg-[#060c18] lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Kiến thức &amp; Nghiên cứu Thể hình
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Các phương pháp khoa học mới nhất về tập luyện, dinh dưỡng và hữu suất đỉnh cao.
            </p>
          </div>
          <Link
            href="#"
            className="mt-3 flex shrink-0 items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline sm:mt-0"
          >
            Đọc tất cả bài viết
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Card className="group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative h-36 bg-gradient-to-br ${post.color}`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <BookOpen className="size-16 text-white" />
        </div>
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {post.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-black leading-snug text-gray-900 transition group-hover:text-[#2563EB] dark:text-white">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {post.excerpt}
        </p>
        <p className="mt-3 text-xs text-gray-400">{post.date}</p>
      </div>
    </Card>
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
  const initials = trainer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="group flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Avatar + Heart */}
      <div className="flex items-start justify-between">
        <div
          className={`flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${trainer.avatarColor ?? "from-[#2563EB] to-[#1D4ED8]"} text-xl font-black text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
        >
          {initials}
        </div>
        <button
          type="button"
          className="rounded-full p-1.5 text-gray-300 transition hover:text-red-400"
          aria-label="Yêu thích"
        >
          <Heart className="size-4" />
        </button>
      </div>

      {/* Name + specialty */}
      <h3 className="mt-3.5 font-black text-gray-900 dark:text-white">{trainer.name}</h3>
      <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:bg-blue-900/30 dark:text-blue-300">
        {trainer.specialty}
      </span>

      {/* Rating */}
      <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
        <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
        <span className="font-black text-gray-800 dark:text-white">{trainer.rating}</span>
        <span className="text-xs">({trainer.reviews})</span>
      </div>

      {/* Experience + Location */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarCheck className="size-3.5 shrink-0" />
          Kinh nghiệm: <span className="font-semibold">{trainer.experience} Năm</span>
        </div>
        {trainer.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="size-3.5 shrink-0" />
            {trainer.location}
          </div>
        )}
      </div>

      {/* Price */}
      <p className="mt-3 font-black text-gray-900 dark:text-white">
        {formatCurrency(trainer.price)}
        <span className="ml-1 text-xs font-normal text-gray-400">/buổi</span>
      </p>

      {/* CTA */}
      <div className="mt-auto pt-4">
        <Link
          className="flex h-9 w-full items-center justify-center rounded-xl border border-[#2563EB] text-sm font-semibold text-[#2563EB] transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
          href={`/trainers/${trainer.id}`}
        >
          Xem Hồ sơ
        </Link>
        {canBook && (
          <Button
            className="mt-2 h-9 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
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
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563EB]">
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
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 min-w-48 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(
                option === "all"
                  ? "common.all"
                  : option === "male" || option === "female"
                    ? `common.${option}`
                    : `packages.${option}`,
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
