"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mediaService } from "@/services/media.service";
import type { MediaEntityType, MediaImageType, MediaUpdateRequest } from "@/types/Media";

export const mediaKeys = {
  all: ["media"] as const,
  list: (entityType: MediaEntityType, entityId: number, imageType?: MediaImageType) =>
    [...mediaKeys.all, entityType, entityId, imageType ?? "ALL"] as const,
};

/** Ảnh của một entity. `enabled` tự tắt khi chưa biết id (form tạo mới). */
export function useEntityMedia(
  entityType: MediaEntityType,
  entityId?: number | null,
  imageType?: MediaImageType,
) {
  return useQuery({
    queryKey: mediaKeys.list(entityType, entityId ?? 0, imageType),
    queryFn: () => mediaService.list(entityType, entityId!, imageType),
    enabled: !!entityId && entityId > 0,
  });
}

export function useDeleteMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mediaService.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useUpdateMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MediaUpdateRequest }) =>
      mediaService.update(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useReorderMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      imageType,
      mediaIds,
    }: {
      entityType: MediaEntityType;
      entityId: number;
      imageType: MediaImageType;
      mediaIds: number[];
    }) => mediaService.reorder({ entityType, entityId, imageType }, mediaIds),
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}
