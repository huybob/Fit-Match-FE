import type { AxiosProgressEvent } from "axios";
import { api } from "@/services/api";
import type {
  Media,
  MediaEntityType,
  MediaImageType,
  MediaPage,
  MediaUpdateRequest,
} from "@/types/Media";

export type {
  Media,
  MediaEntityType,
  MediaImageType,
  MediaPage,
  MediaUpdateRequest,
} from "@/types/Media";
export { MEDIA_LIMITS } from "@/types/Media";

export interface UploadTarget {
  entityType: MediaEntityType;
  /** Bỏ trống = ảnh nháp: upload trước khi bản ghi tồn tại (soạn đánh giá). */
  entityId?: number | null;
  imageType: MediaImageType;
}

/**
 * Media API (BE V64) — một đường duy nhất cho mọi loại ảnh trong hệ thống.
 * File đi thẳng lên Google Cloud Storage ở phía BE; FE chỉ gửi multipart và
 * nhận lại metadata + URL đã giải sẵn.
 */
export const mediaService = {
  upload: (
    files: File[],
    target: UploadTarget,
    onProgress?: (percent: number) => void,
  ) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return api.post<Media[], FormData>("/media/upload", form, {
      params: {
        entityType: target.entityType,
        entityId: target.entityId ?? undefined,
        imageType: target.imageType,
      },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
  },

  list: (entityType: MediaEntityType, entityId: number, imageType?: MediaImageType) =>
    api.get<Media[]>("/media", { params: { entityType, entityId, imageType } }),

  listPaged: (
    entityType: MediaEntityType,
    entityId: number,
    params?: { imageType?: MediaImageType; page?: number; size?: number },
  ) =>
    api.get<MediaPage>("/media/page", {
      params: { entityType, entityId, page: 0, size: 24, ...params },
    }),

  update: (id: number, payload: MediaUpdateRequest) =>
    api.patch<Media, MediaUpdateRequest>(`/media/${id}`, payload),

  reorder: (target: Required<UploadTarget>, mediaIds: number[]) =>
    api.patch<Media[], { mediaIds: number[] }>("/media/reorder", { mediaIds }, {
      params: {
        entityType: target.entityType,
        entityId: target.entityId,
        imageType: target.imageType,
      },
    }),

  async remove(id: number) {
    await api.deleteRaw(`/media/${id}`);
  },
};
