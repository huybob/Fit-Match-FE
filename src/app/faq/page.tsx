"use client";

import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/modules/layout/site-layout";
import { cmsService } from "@/services/cms.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";

export default function FaqRoute() {
  const query = useQuery({ queryKey: ["public", "cms", "FAQ"], queryFn: () => cmsService.publicByType("FAQ") });
  const items = query.data ?? [];

  return (
    <SiteLayout>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black">Câu hỏi thường gặp</h1>
        <p className="mt-2 text-sm text-muted-foreground">Giải đáp các thắc mắc phổ biến về FitMatch.</p>

        <div className="mt-6">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title="Không tải được" description={toErrorMessage(query.error)} />
          ) : !items.length ? (
            <EmptyState title="Chưa có nội dung" description="Nội dung FAQ sẽ được cập nhật." />
          ) : (
            <div className="space-y-3">
              {items.map((f) => (
                <details key={f.id} className="rounded-2xl border border-border bg-card p-4">
                  <summary className="cursor-pointer font-bold">{f.title}</summary>
                  {f.body && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{f.body}</p>}
                </details>
              ))}
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}
