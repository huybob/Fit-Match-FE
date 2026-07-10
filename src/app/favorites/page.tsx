"use client";

import Link from "next/link";
import { Heart, UserRound, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "@/services/favorites.service";
import { SiteLayout } from "@/modules/layout/site-layout";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useToast } from "@/lib/toast-provider";

function FavoritesContent() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["favorites", "pts"],
    queryFn: favoritesService.list,
  });

  const remove = useMutation({
    mutationFn: (ptId: number) => favoritesService.remove(ptId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites", "pts"] });
      toast({ type: "success", title: "Đã bỏ khỏi yêu thích" });
    },
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-2">
          <Heart className="size-6 text-red-500 fill-red-500" />
          <h1 className="text-3xl font-black">Huấn luyện viên yêu thích</h1>
        </div>
        <p className="mt-2 text-muted-foreground">Danh sách PT bạn đã lưu để xem lại sau.</p>

        <section className="mt-8">
          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title="Không thể tải danh sách" description={toErrorMessage(query.error)} />
          ) : (query.data ?? []).length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(query.data ?? []).map((pt) => (
                <article key={pt.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserRound className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black">{pt.displayName}</h2>
                      {pt.specialization && <p className="truncate text-sm text-muted-foreground">{pt.specialization}</p>}
                    </div>
                  </div>
                  {pt.serviceArea && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-4" />{pt.serviceArea}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <Link className="font-black text-[#2563eb]" href={`/trainers/${pt.id}`}>Xem chi tiết</Link>
                    <button
                      onClick={() => pt.id && remove.mutate(pt.id)}
                      disabled={remove.isPending}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                    >
                      <Heart className="size-3.5 fill-red-500" /> Bỏ thích
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có PT yêu thích" description="Duyệt danh sách huấn luyện viên và bấm ♥ để lưu." />
          )}
        </section>
      </main>
    </SiteLayout>
  );
}

export default function FavoritesPage() {
  return (
    <AuthGuard roles={["ROLE_CUSTOMER"]}>
      <FavoritesContent />
    </AuthGuard>
  );
}
