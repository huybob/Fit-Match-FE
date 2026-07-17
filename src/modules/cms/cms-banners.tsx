"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";

/** UC-074: dải banner công khai trên trang chủ (ẩn nếu chưa cấu hình). */
export function CmsBanners() {
  const query = useQuery({
    queryKey: ["public", "cms", "BANNER"],
    queryFn: () => cmsService.publicByType("BANNER"),
    staleTime: 5 * 60_000,
  });
  const banners = query.data ?? [];
  if (!banners.length) return null;

  return (
    <section className="bg-muted/40 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => {
            const card = (
              <div className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-lg">
                {b.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title} className="h-40 w-full object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-black text-foreground group-hover:text-primary">{b.title}</h3>
                  {b.body && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{b.body}</p>}
                </div>
              </div>
            );
            return b.link ? (
              <Link key={b.id} href={b.link}>{card}</Link>
            ) : (
              <div key={b.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
