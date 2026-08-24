"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Chọn 1..5 sao. Tách khỏi `review-pages` khi màn "Vé của tôi" và hộp chi tiết
 * buổi tập cũng cần tạo đánh giá — ba chỗ chấm điểm phải cho ra cùng một thao
 * tác, không phải ba biến thể na ná nhau.
 */
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-2" onMouseLeave={() => setHover(0)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={t("review.rateStars", { count: star })}
            aria-pressed={value === star}
            className="rounded p-0.5 text-warning transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onClick={() => onChange(star)}
          >
            <Star className={`size-7 ${star <= shown ? "fill-current" : "fill-transparent"}`} />
          </button>
        ))}
      </div>
      <span className="text-sm font-bold text-muted-foreground">{shown}/5</span>
    </div>
  );
}
