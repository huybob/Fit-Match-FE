"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/modules/layout/site-layout";
import { cmsService } from "@/services/cms.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";

export default function BlogRoute() {
  const query = useQuery({ queryKey: ["public", "cms", "BLOG"], queryFn: () => cmsService.publicByType("BLOG") });
  const items = query.data ?? [];

  return (
    <SiteLayout>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black">Blog</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kiến thức luyện tập, dinh dưỡng và tin tức từ FitMatch.</p>

        <div className="mt-6">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title="Không tải được" description={toErrorMessage(query.error)} />
          ) : !items.length ? (
            <EmptyState title="Chưa có bài viết" description="Nội dung blog sẽ được cập nhật." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((b) => {
                const card = (
                  <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-lg">
                    {b.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.imageUrl} alt={b.title} className="h-40 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <h2 className="font-black">{b.title}</h2>
                      {b.body && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{b.body}</p>}
                    </div>
                  </article>
                );
                return b.link ? <Link key={b.id} href={b.link}>{card}</Link> : <div key={b.id}>{card}</div>;
              })}
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}
