import type { Media, MediaImageType } from "@/types/Media";

/** Hình dạng tối thiểu mà một ảnh cần có để đưa vào ImageGallery/ImageViewer. */
interface ImageLike {
  id?: number;
  url?: string;
  thumbnailUrl?: string;
  caption?: string;
  imageType?: MediaImageType;
  sortOrder?: number;
  primary?: boolean;
}

/**
 * Chuẩn hoá ảnh từ các endpoint có DTO riêng (vd `PublicGymMedia` của
 * marketplace) về kiểu `Media` mà ImageGallery dùng.
 *
 * Ảnh thiếu `url` bị loại ngay tại đây: để lọt xuống lưới thì mỗi ô chỉ là một
 * khung xám vô nghĩa, và người dùng tưởng thư viện bị lỗi.
 */
export function toGalleryImages(items: ImageLike[] | undefined | null): Media[] {
  return (items ?? [])
    .filter((item): item is ImageLike & { id: number; url: string } => !!item.url && item.id != null)
    .map((item) => ({
      id: item.id,
      entityType: "GYM",
      imageType: item.imageType ?? "GALLERY",
      url: item.url,
      thumbnailUrl: item.thumbnailUrl ?? item.url,
      caption: item.caption,
      sortOrder: item.sortOrder ?? 0,
      primary: item.primary ?? false,
    }));
}
