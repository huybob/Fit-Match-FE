"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { ImageUploader } from "@/shared/components/media/image-uploader";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { Media } from "@/types/Media";
import { useCreateReview } from "../hooks/use-review";
import { useReviewSchemas } from "../use-review-schemas";
import { StarRatingInput } from "./star-rating-input";

/** Đối tượng đang được chấm điểm — quyết định endpoint và câu dẫn của form. */
export type ReviewTarget =
  | { kind: "gym"; ticketId: number; name: string }
  | { kind: "pt"; sessionId: number; name: string; date: string };

/**
 * Tạo đánh giá tại chỗ, ngay cạnh thứ đang được chấm (câu 17 + 36).
 *
 * <p>Trước đây `reviewGym`/`reviewPt` có sẵn ở tầng service mà KHÔNG màn hình
 * nào gọi: nút "Đánh giá" trên vé chỉ dẫn sang /profile/reviews — trang đó chỉ
 * sửa/xoá đánh giá đã có, nên khách không có đường nào tạo cái đầu tiên. Còn
 * đánh giá HLV thì không có lối vào nào cả.
 *
 * <p>Dùng chung một form cho hai loại vì thứ khách nhập là một: sao, nhận xét,
 * ảnh. Chỉ khác đường gửi và dòng nói rõ đang chấm ai.
 */
export function ReviewCreateDialog({
  target,
  onClose,
}: {
  target: ReviewTarget;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const create = useCreateReview();
  const schemas = useReviewSchemas();
  const [images, setImages] = useState<Media[]>([]);
  const form = useForm<z.infer<typeof schemas.review>>({
    resolver: zodResolver(schemas.review),
    defaultValues: { rating: 0, comment: "", mediaIds: [] },
  });

  return (
    <Dialog
      open
      title={t(target.kind === "gym" ? "review.createGymTitle" : "review.createPtTitle")}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await create.mutateAsync(
              target.kind === "gym"
                ? { kind: "gym", ticketId: target.ticketId, ...v }
                : { kind: "pt", sessionId: target.sessionId, ...v },
            );
            toast({ type: "success", title: t("review.created") });
            onClose();
          } catch (e) {
            toast({
              type: "error",
              title: t("review.requestFailed"),
              description: toErrorMessage(e),
            });
          }
        })}
      >
        <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {target.kind === "gym"
            ? t("review.createGymSubject", { name: target.name })
            : t("review.createPtSubject", { name: target.name, date: target.date })}
        </p>

        <FieldShell label={t("review.ratingLabel")} error={form.formState.errors.rating}>
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <StarRatingInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>

        <FieldShell label={t("review.contentLabel")} error={form.formState.errors.comment}>
          <Textarea {...form.register("comment")} aria-invalid={!!form.formState.errors.comment} />
        </FieldShell>

        <FieldShell label={t("review.imagesLabel")}>
          {/* entityId bỏ trống: ảnh lên GCS dạng "nháp" và chỉ được gắn vào đánh
              giá khi bấm Gửi. Bỏ dở form thì job dọn rác của BE xoá. */}
          <ImageUploader
            entityType="REVIEW"
            imageType="REVIEW_IMAGE"
            value={images}
            onChange={(next) => {
              setImages(next);
              form.setValue("mediaIds", next.map((m) => m.id));
            }}
            max={5}
          />
        </FieldShell>

        <Button disabled={create.isPending}>{t("review.submit")}</Button>
      </form>
    </Dialog>
  );
}
