"use client";

// Phase 4 (audit 2026-07-17): trang chủ tách khỏi modules/ecommerce (cụm mock cũ
// ~1000 dòng đã xóa) — chỉ giữ Hero + các section dữ liệu thật (CMS, PT, Gym).

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { appRoutes } from "@/constants/ecommerce.constant";
import { useAuthStore } from "@/modules/auth/auth.store";
import { CmsBanners } from "@/modules/cms/cms-banners";
import { FeaturedSection } from "@/modules/cms/featured-section";
import { RealGymsSection, RealTrainersSection } from "@/modules/home/real-sections";
import { SiteLayout } from "@/modules/layout/site-layout";

function useCanBook() {
  const { user, status } = useAuthStore();
  return status !== "authenticated" || user?.role === "ROLE_CUSTOMER";
}

export function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <CmsBanners />
      <FeaturedSection />
      <RealTrainersSection />
      <RealGymsSection />
    </SiteLayout>
  );
}

function Hero() {
  const canBook = useCanBook();

  return (
    <section className="relative overflow-hidden bg-card">
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-primary">
            Nền tảng Thể thao Đẳng cấp Thế giới
          </span>
          <h1 className="mt-5 max-w-lg text-5xl font-black leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            Nâng tầm Hiệu suất cùng{" "}
            <span className="text-primary">Chuyên gia Hàng đầu</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Kết nối với các huấn luyện viên cá nhân được xác thực và phòng gym
            cao cấp phù hợp với hành trình thể hình của bạn. Đặt lịch trực
            tuyến, theo dõi hiệu suất và hỗ trợ cộng đồng trong một hệ sinh thái
            duy nhất.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {canBook && (
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
                href={appRoutes.trainers}
              >
                <Users className="size-4" />
                Tìm PT
              </Link>
            )}
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted/40"
              href={appRoutes.gyms}
            >
              Tìm Phòng tập
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl shadow-blue-900/30"
            style={{ aspectRatio: "4/5" }}
          >
            <Image
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1000&auto=format&fit=crop"
              alt="Gym Training"
              fill
              sizes="(min-width: 1024px) 40vw, 0px"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
