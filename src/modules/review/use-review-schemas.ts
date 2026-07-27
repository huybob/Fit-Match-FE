"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useValidators } from "@/shared/validations/use-validators";

/**
 * Schema đánh giá / phản hồi đánh giá.
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
      bookingId: z
        .number()
        .int()
        .positive({ message: t("review.validation.pickBooking") }),
      rating: z
        .number()
        .int()
        .min(1, { message: t("review.validation.rating") })
        .max(5, { message: t("review.validation.rating") }),
      comment: v.optionalText(t("review.contentLabel"), 2000).optional(),
    });

    const reply = z.object({
      reply: v.requiredText(t("review.reply"), { max: 2000 }),
    });

    return { review, reply };
  }, [v, t]);
}
