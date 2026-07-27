"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, UserRound, MapPin, Building2, Scale } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "@/services/favorites.service";
import { CompareGymsDialog, ComparePtsDialog } from "@/modules/favorite/compare-dialog";
import { ProfileSidebar } from "@/modules/user/components/profile-sidebar";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useToast } from "@/lib/toast-provider";
import { useTranslations } from "next-intl";

const MAX_COMPARE = 3;

/** UC-010: chọn 2-3 mục để so sánh side-by-side. */
function useCompareSelection() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  function toggle(id: number, checked: boolean) {
    setSelected((prev) => {
      if (!checked) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) {
        toast({ type: "warning", title: `So sánh tối đa ${MAX_COMPARE} mục` });
        return prev;
      }
      return [...prev, id];
    });
  }
  return { selected, toggle, open, setOpen };
}

/** A-11 (audit 2026-07-17): section Gym yêu thích — trước đây chỉ có PT. */
function FavoriteGymsSection() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["favorites", "gyms"],
    queryFn: favoritesService.listGyms,
  });
  const remove = useMutation({
    mutationFn: (gymId: number) => favoritesService.removeGym(gymId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites", "gyms"] });
      toast({ type: "success", title: t("member.favorites.removed") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });
  const items = query.data ?? [];
  const compare = useCompareSelection();
  const selectedGyms = items.filter((g) => g.id != null && compare.selected.includes(g.id));

  return (
    <div className="mt-10">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="size-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{t("member.favorites.gymsTitle")}</h2>
        </div>
        {/* UC-010: so sánh 2-3 gym đã tick */}
        {items.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={compare.selected.length < 2}
            onClick={() => compare.setOpen(true)}
          >
            <Scale className="size-3.5" /> {t("member.favorites.compareCount", { count: compare.selected.length })}
          </Button>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t("member.favorites.gymsHint")}</p>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("marketplace.listLoadError")} description={toErrorMessage(query.error)} />
      ) : items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((gym) => (
            <article key={gym.id} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm">
              {gym.id != null && (
                <Checkbox
                  className="absolute right-4 top-4"
                  aria-label={t("member.favorites.selectToCompare")}
                  checked={compare.selected.includes(gym.id)}
                  onCheckedChange={(c) => compare.toggle(gym.id!, c === true)}
                />
              )}
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary text-primary-foreground">
                  <Building2 className="size-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-foreground">{gym.gymName}</h3>
                  {(gym.address || gym.city) && (
                    <p className="truncate text-sm text-muted-foreground">
                      {[gym.address, gym.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link className="font-bold text-primary hover:underline" href={`/gyms/${gym.id}`}>{t("common.actions.viewDetail")}</Link>
                <Button variant="link" size="inline" onClick={() => gym.id != null && remove.mutate(gym.id)} disabled={remove.isPending} className="flex gap-1 text-destructive">
                  <Heart className="size-3.5 fill-destructive" /> {t("member.favorites.unlike")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={t("member.favorites.noGyms")} description={t("member.favorites.noGymsHint")} />
      )}

      <CompareGymsDialog open={compare.open} onClose={() => compare.setOpen(false)} gyms={selectedGyms} />
    </div>
  );
}

export default function ProfileFavoritesPage() {
  const t = useTranslations();
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
      toast({ type: "success", title: t("member.favorites.removed") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  const items = query.data ?? [];
  const compare = useCompareSelection();
  const selectedPts = items.filter((p) => p.id != null && compare.selected.includes(p.id));

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 xl:px-20">
        <ProfileSidebar />

        <main className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Heart className="size-6 text-destructive fill-destructive" />
              <h1 className="text-2xl font-bold text-foreground">{t("member.favorites.trainersTitle")}</h1>
            </div>
            {/* UC-010: so sánh 2-3 PT đã tick */}
            {items.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={compare.selected.length < 2}
                onClick={() => compare.setOpen(true)}
              >
                <Scale className="size-3.5" /> {t("member.favorites.compareCount", { count: compare.selected.length })}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">{t("member.favorites.trainersHint")}</p>

          {query.isLoading ? (
            <LoadingSkeleton />
          ) : query.isError ? (
            <EmptyState title={t("marketplace.listLoadError")} description={toErrorMessage(query.error)} />
          ) : items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((pt) => (
                <article key={pt.id} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm">
                  {pt.id != null && (
                    <Checkbox
                      className="absolute right-4 top-4"
                      aria-label={t("member.favorites.selectToCompare")}
                      checked={compare.selected.includes(pt.id)}
                      onCheckedChange={(c) => compare.toggle(pt.id!, c === true)}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary text-primary-foreground">
                      <UserRound className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-foreground">{pt.displayName}</h2>
                      {pt.specialization && <p className="truncate text-sm text-primary font-medium">{pt.specialization}</p>}
                    </div>
                  </div>
                  {pt.serviceArea && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-4" />{pt.serviceArea}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <Link className="font-bold text-primary hover:underline" href={`/trainers/${pt.id}`}>{t("common.actions.viewDetail")}</Link>
                    <Button variant="link" size="inline" onClick={() => pt.id && remove.mutate(pt.id)} disabled={remove.isPending} className="flex gap-1 text-destructive">
                      <Heart className="size-3.5 fill-destructive" /> {t("member.favorites.unlike")}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t("member.favorites.noTrainers")} description={t("member.favorites.noTrainersHint")} />
          )}

          <ComparePtsDialog open={compare.open} onClose={() => compare.setOpen(false)} pts={selectedPts} />

          <FavoriteGymsSection />
        </main>
      </div>
    </div>
  );
}
