"use client";

import Link from "next/link";
import { Heart, UserRound, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "@/services/favorites.service";
import { ProfileSidebar } from "@/modules/user/components/profile-sidebar";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useToast } from "@/lib/toast-provider";

export default function ProfileFavoritesPage() {
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

  const items = query.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex gap-6 px-20 py-6">
        <ProfileSidebar />

        <main className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="size-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-[#0f172a]">Huấn luyện viên yêu thích</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">Danh sách PT bạn đã lưu để xem lại và liên hệ sau.</p>

          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title="Không thể tải danh sách" description={toErrorMessage(query.error)} />
          ) : items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((pt) => (
                <article key={pt.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <UserRound className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-[#0f172a]">{pt.displayName}</h2>
                      {pt.specialization && <p className="truncate text-sm text-[#2563eb] font-medium">{pt.specialization}</p>}
                    </div>
                  </div>
                  {pt.serviceArea && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="size-4" />{pt.serviceArea}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <Link className="font-bold text-[#2563eb] hover:underline" href={`/trainers/${pt.id}`}>Xem chi tiết</Link>
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
        </main>
      </div>
    </div>
  );
}
