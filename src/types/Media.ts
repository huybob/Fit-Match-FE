import type { PageResponse } from "@/shared/types/api-response.type";

/** Khớp com.fitmatch.common.enums.MediaEntityType (BE V64). */
export type MediaEntityType =
  | "USER"
  | "GYM"
  | "BRANCH"
  | "SERVICE"
  | "PACKAGE"
  | "CHECK_IN"
  | "TRAINER"
  | "REVIEW"
  | "FACILITY";

/** Khớp com.fitmatch.common.enums.MediaImageType. */
export type MediaImageType =
  | "AVATAR"
  | "COVER"
  | "GALLERY"
  | "THUMBNAIL"
  | "REVIEW_IMAGE"
  | "CHECKIN_IMAGE";

/**
 * MediaResponse của BE. `url`/`thumbnailUrl` đã được BE giải sẵn (public URL của
 * GCS, hoặc signed URL khi bucket private) nên FE không bao giờ chạm tới
 * credentials hay tự dựng đường dẫn storage.
 */
export interface Media {
  id: number;
  entityType: MediaEntityType;
  entityId?: number | null;
  imageType: MediaImageType;
  url: string;
  thumbnailUrl?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number | null;
  height?: number | null;
  caption?: string;
  sortOrder: number;
  primary: boolean;
  createdAt?: string;
}

export interface MediaUpdateRequest {
  caption?: string;
  primary?: boolean;
  sortOrder?: number;
}

export type MediaPage = PageResponse<Media>;

/**
 * Ràng buộc phía client, khớp mặc định của `app.media.*` ở BE. Kiểm ở FE chỉ để
 * người dùng biết ngay mà không phải chờ upload xong — BE vẫn kiểm lại toàn bộ
 * (kể cả magic bytes, thứ FE không kiểm được).
 */
export const MEDIA_LIMITS = {
  maxSizeMb: 5,
  maxFiles: 10,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  accept: "image/jpeg,image/png,image/webp",
};
