import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.util";

/**
 * Vỏ CHUẨN cho card kết quả ở các trang danh sách công khai (gói tập, huấn luyện
 * viên, …). Ba vùng cố định theo đúng thứ tự:
 *
 * 1. `media`    — ảnh/khối màu đầu card (tuỳ chọn).
 * 2. `children` — nội dung, vùng DUY NHẤT được co giãn.
 * 3. `footer`   — giá + nút hành động, DÁN ĐÁY card.
 *
 * Lý do tồn tại: lưới card cao bằng nhau (`items-stretch` mặc định của grid) nhưng
 * mỗi card lại có số dòng khác nhau — mô tả dài/ngắn, có/không khu vực, có/không
 * link phòng gym. Nút bám ngay dưới đoạn nội dung nên card ít chữ có nút nằm cao
 * hơn, mắt phải nhảy theo từng ô. `h-full` + `flex-1` cho nội dung + `mt-auto` cho
 * footer khiến mọi nút hành động trong cùng một hàng nằm trên CÙNG một đường ngang.
 *
 * Vì vậy footer phải nhận đúng phần "giá + nút", đừng để chúng lẫn trong children.
 */
export function ResultCard({
  media,
  footer,
  className,
  children,
}: {
  media?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {media}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="min-w-0 flex-1 space-y-2">{children}</div>
        {/* `mt-auto` + `pt-4` (không dùng `mt-4`: hai lớp margin-top sẽ triệt tiêu
            nhau qua tailwind-merge) — footer dán đáy và vẫn cách nội dung. */}
        {footer ? <div className="mt-auto min-w-0 pt-4">{footer}</div> : null}
      </div>
    </article>
  );
}

/**
 * Dòng phụ có icon (phòng gym, khu vực, …). Gom ở đây để hai trang không lệch
 * nhau về cỡ chữ/icon, và để dòng dài luôn bị cắt gọn thay vì đẩy card cao thêm.
 */
export function ResultCardMeta({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className="shrink-0 [&>svg]:size-3.5">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </p>
  );
}

/**
 * Mô tả ngắn của card — luôn chiếm CHỖ của hai dòng kể cả khi không có mô tả, để
 * các dòng bên dưới của mọi card trong hàng thẳng nhau.
 */
export function ResultCardExcerpt({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("line-clamp-2 min-h-10 text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}
