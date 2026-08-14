"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useValidators } from "@/shared/validations/use-validators";

/**
 * Schema đánh giá (review một chiều — không có phản hồi của gym).
 *
 * Schema tĩnh cũ không truyền message nên zod trả chuỗi mặc định tiếng Anh
 * ("Too small: expected number to be >=1"). Ràng buộc giữ NGUYÊN, chỉ bổ sung
 * message đã dịch.
 */
export function useReviewSchemas() {
  const v = useValidators();
  const t = useTranslations();

  return useMemo(() => {
    const review = z.object({
      rating: z
        .number()
        .int()
        .min(1, { message: t("review.validation.rating") })
        .max(5, { message: t("review.validation.rating") }),
      comment: v.optionalText(t("review.contentLabel"), 2000).optional(),
      // Ảnh đã upload xong (có id) tại thời điểm submit — BE gắn vào review trong
      // cùng giao dịch tạo/sửa.
      mediaIds: z.array(z.number().int().positive()).max(10).optional(),
    });

    return { review };
  }, [v, t]);
}
