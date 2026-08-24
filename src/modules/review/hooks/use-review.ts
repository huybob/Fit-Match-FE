"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ModerateReviewRequest,
  reviewService,
  ReportStatus,
  ReviewRequest,
} from "@/services/review.service";
import { reviewKeys } from "../query-keys";
import { ticketService } from "@/services/ticket.service";
import { ticketKeys } from "@/modules/ticket/query-keys";

/** Đầu vào tạo đánh giá — kind quyết định endpoint và id đi kèm. */
export type CreateReviewInput = { rating: number; comment?: string; mediaIds?: number[] } & (
  | { kind: "gym"; ticketId: number }
  | { kind: "pt"; sessionId: number }
);

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: reviewKeys.all });

/** scope customer -> /reviews/me; pt -> public /reviews/pt/{id}; gym -> operator's own (mọi trạng thái). */
export function useReviews(scope: "customer" | "pt" | "gym", id = 0) {
  return useQuery({
    queryKey: reviewKeys.list(scope, id),
    queryFn: () =>
      scope === "customer"
        ? reviewService.getMine()
        : scope === "pt"
          ? reviewService.getPt(id)
          : reviewService.getGymOwn(),
    enabled: scope === "customer" || scope === "gym" || id > 0,
  });
}

export function useSaveReview() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReviewRequest }) =>
      reviewService.update(id, payload),
    onSuccess: refresh(c),
  });
}

/**
 * Tạo đánh giá. Hai mốc mở khác nhau nên hai đường khác nhau (câu 17 + 36):
 * phòng gym chấm theo VÉ khi đã dùng hết, HLV chấm theo BUỔI khi buổi đó xong.
 * Đối tượng đi trong đường dẫn nên endpoint nằm ở ticketService.
 *
 * Invalidate cả `tickets`: nút "Đánh giá" trên vé và trên buổi tập ẩn đi dựa
 * vào danh sách đánh giá của chính khách, không refresh thì nút vẫn mời lần hai
 * rồi nhận 409 "đã được đánh giá".
 */
export function useCreateReview() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      input.kind === "gym"
        ? ticketService.reviewGym(input.ticketId, input.rating, input.comment, input.mediaIds)
        : ticketService.reviewPt(input.sessionId, input.rating, input.comment, input.mediaIds),
    onSuccess: () => {
      c.invalidateQueries({ queryKey: reviewKeys.all });
      c.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

/**
 * Vé / buổi tập đã đánh giá rồi — nguồn để ẩn nút mời đánh giá.
 *
 * BE chặn bằng existsByTicket_Id / existsBySession_Id nên mọi trạng thái đánh
 * giá đều tính, kể cả cái đã bị kiểm duyệt gỡ; danh sách này lấy từ
 * /reviews/me nên khớp đúng luật đó. Xin size lớn vì số đánh giá của một khách
 * bị chặn trên bởi số vé và số buổi họ đã tập.
 */
export function useMyReviewedTargets() {
  const query = useQuery({
    queryKey: reviewKeys.list("customer-reviewed"),
    queryFn: () => reviewService.getMine({ size: 200 }),
  });
  const items = query.data?.content ?? [];
  return {
    ticketIds: new Set(items.filter((r) => r.ticketId != null).map((r) => r.ticketId!)),
    sessionIds: new Set(items.filter((r) => r.sessionId != null).map((r) => r.sessionId!)),
  };
}

export function useDeleteReview() {
  const c = useQueryClient();
  return useMutation({ mutationFn: reviewService.remove, onSuccess: refresh(c) });
}

/**
 * UC-009: review công khai (VISIBLE) của một gym/PT cho trang marketplace.
 * Dùng cho khách vãng lai nên không cần đăng nhập; `size` để trang chi tiết
 * hiển thị thêm khi bấm "Xem thêm".
 */
export function usePublicReviews(scope: "gym" | "pt", id: number, size = 5) {
  return useQuery({
    queryKey: [...reviewKeys.list(`public-${scope}`, id), size],
    queryFn: () =>
      scope === "gym"
        ? reviewService.getGym(id, { page: 0, size })
        : reviewService.getPt(id, { page: 0, size }),
    enabled: id > 0,
  });
}

/** UC-009: điểm trung bình + phổ điểm sao của gym/PT cho trang chi tiết. */
export function useRatingSummary(scope: "gym" | "pt", id: number) {
  return useQuery({
    queryKey: [...reviewKeys.all, "rating", scope, id],
    queryFn: () =>
      scope === "gym" ? reviewService.getGymRating(id) : reviewService.getPtRating(id),
    enabled: id > 0,
  });
}

/** UC-070: báo cáo review công khai có vấn đề. */
export function useReportReview() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      reviewService.report(id, reason),
  });
}

// ---- Moderator/Admin (UC-071) ----
export function useReviewReports(status: ReportStatus = "OPEN") {
  return useQuery({
    queryKey: [...reviewKeys.all, "reports", status],
    queryFn: () => reviewService.getReports(status),
  });
}

export function useModerateReview() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ModerateReviewRequest }) =>
      reviewService.moderate(id, payload),
    onSuccess: refresh(c),
  });
}

export function useResolveReport() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dismiss, note }: { id: number; dismiss?: boolean; note?: string }) =>
      dismiss ? reviewService.dismissReport(id, note) : reviewService.resolveReport(id, note),
    onSuccess: refresh(c),
  });
}
