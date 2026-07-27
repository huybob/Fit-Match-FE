"use client";

// E-17 (audit 2026-07-17, UC-074): CMS type FEATURED trước đây write-only —
// admin tạo được nhưng không trang public nào render. Section này hiển thị
// chiến dịch/gym nổi bật trên trang chủ (ẩn nếu chưa cấu hình).

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";
import { useTranslations } from "next-intl";

export function FeaturedSection() {
  const t = useTranslations();
  const query = useQuery({
    queryKey: ["public", "cms", "FEATURED"],
    queryFn: () => cmsService.publicByType("FEATURED"),
    staleTime: 5 * 60_000,
  });
  const items = query.data ?? [];
  if (!items.length) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-2xl font-black text-foreground">{t("cms.featuredTitle")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => {
            const card = (
              <div className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                {f.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.imageUrl} alt={f.title} className="h-32 w-full object-cover" />
                )}
                <div className="p-4">
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {t("cms.featuredBadge")}
                  </span>
                  <h3 className="mt-1.5 font-black text-foreground group-hover:text-primary">{f.title}</h3>
                  {f.body && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{f.body}</p>}
                </div>
              </div>
            );
            return f.link ? (
              <Link key={f.id} href={f.link}>{card}</Link>
            ) : (
              <div key={f.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
