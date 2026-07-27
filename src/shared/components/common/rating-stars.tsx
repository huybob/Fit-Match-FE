import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * UC-071: hiển thị điểm đánh giá trung bình + số lượt dưới dạng sao.
 * rating null/undefined hoặc count 0 -> "Chưa có đánh giá".
 */
export function RatingStars({ rating, count }: { rating?: number | null; count?: number | null }) {
  const t = useTranslations();
  if (!count || rating == null) {
    return <span className="text-xs text-muted-foreground">{t("common.states.noRating")}</span>;
  }
  const value = Number(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center gap-0.5 text-warning">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`size-3.5 ${i <= Math.round(value) ? "fill-current" : "fill-transparent"}`} />
        ))}
      </span>
      <span className="text-xs font-bold text-foreground">{value.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </span>
  );
}
