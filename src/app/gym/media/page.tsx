"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { gymService, type GymMediaItem } from "@/services/gym.service";
import { mediaService } from "@/services/media.service";
import type { Media, MediaImageType } from "@/types/Media";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { ListState } from "@/shared/components/common/list-state";
import { ImageUploader } from "@/shared/components/media/image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const GYM_SCOPE = "gym";

/** GymMediaItem của BE -> kiểu Media mà các component ảnh dùng chung. */
function toMedia(item: GymMediaItem): Media {
  return {
    id: item.id,
    entityType: item.branchId != null ? "BRANCH" : "GYM",
    entityId: item.branchId ?? null,
    imageType: item.imageType ?? "GALLERY",
    url: item.url,
    thumbnailUrl: item.thumbnailUrl ?? item.url,
    caption: item.caption,
    sortOrder: item.sortOrder ?? 0,
    primary: item.primary ?? false,
  };
}

/**
 * UC-016 — quản lý ảnh của Gym và từng chi nhánh.
 *
 * Trước V64 chủ gym phải upload file ở một chỗ rồi dán URL vào chỗ khác; giờ chọn
 * ảnh là xong, file lên thẳng Google Cloud Storage và metadata được ghi cùng lúc.
 */
export default function GymMediaPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [scope, setScope] = useState<string>(GYM_SCOPE);
  const [imageType, setImageType] = useState<MediaImageType>("GALLERY");

  const branchId = scope === GYM_SCOPE ? undefined : Number(scope);

  const branchesQuery = useQuery({
    queryKey: ["gym-branches"],
    queryFn: gymService.listOwnBranches,
  });
  const mediaQuery = useQuery({
    queryKey: ["gym-media", branchId ?? GYM_SCOPE],
    queryFn: () => gymService.listMedia(branchId),
  });

  // Danh sách của BE là nguồn sự thật; ImageUploader chỉ hiển thị và gọi lại API.
  const images = useMemo(
    () =>
      (mediaQuery.data ?? [])
        .filter((m) => (branchId == null ? m.branchId == null : m.branchId === branchId))
        .filter((m) => m.imageType === imageType || (!m.imageType && imageType === "GALLERY"))
        .map(toMedia),
    [mediaQuery.data, branchId, imageType],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["gym-media"] });

  const removeMut = useMutation({
    mutationFn: (id: number) => gymService.deleteMedia(id),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: t("media.deleted") });
    },
    onError: (e) =>
      toast({ type: "error", title: t("media.deleteFailed"), description: toErrorMessage(e) }),
  });

  const primaryMut = useMutation({
    mutationFn: (id: number) => mediaService.update(id, { primary: true }),
    onSuccess: () => {
      invalidate();
      toast({ type: "success", title: t("media.primarySet") });
    },
    onError: (e) =>
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t("gym.media.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("gym.media.subtitle")}</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <div className="min-w-52">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {t("gym.media.scopeLabel")}
            </label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GYM_SCOPE}>{t("gym.media.wholeGym")}</SelectItem>
                {(branchesQuery.data ?? [])
                  .filter((b) => b.active !== false && b.id != null)
                  .map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-44">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {t("gym.media.typeLabel")}
            </label>
            <Select value={imageType} onValueChange={(v) => setImageType(v as MediaImageType)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GALLERY">{t("gym.media.gallery")}</SelectItem>
                <SelectItem value="COVER">{t("gym.media.cover")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ListState
          query={mediaQuery}
          isEmpty={false}
          emptyIcon={Images}
          emptyTitle={t("media.galleryEmpty")}
          emptyDescription={t("media.galleryEmptyHint")}
        >
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <ImageUploader
              entityType={branchId != null ? "BRANCH" : "GYM"}
              entityId={branchId ?? 0}
              imageType={imageType}
              value={images}
              // Danh sách được refetch từ BE nên onChange chỉ cần kích hoạt invalidate;
              // giữ state cục bộ song song sẽ lệch với thứ tự/cờ ảnh chính do BE quyết định.
              onChange={() => invalidate()}
              onRemove={(m) => removeMut.mutateAsync(m.id).then(() => undefined)}
              onSetPrimary={(m) => primaryMut.mutateAsync(m.id).then(() => undefined)}
              // COVER là ảnh đơn: upload ảnh mới thì BE tự thay ảnh bìa cũ.
              multiple={imageType === "GALLERY"}
              max={imageType === "COVER" ? 1 : 10}
              uploadFn={async (files, onProgress) => {
                const uploaded = await gymService.uploadMedia(
                  files,
                  { branchId, imageType },
                  onProgress,
                );
                return uploaded.map(toMedia);
              }}
            />
          </div>
        </ListState>
      </div>
    </main>
  );
}
