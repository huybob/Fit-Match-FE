"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ModerateReviewRequest,
  reviewService,
  ReportStatus,
  ReviewRequest,
} from "@/services/review.service";
import { reviewKeys } from "../query-keys";

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
    mutationFn: ({ id, payload }: { id?: number; payload: ReviewRequest }) =>
      id ? reviewService.update(id, payload) : reviewService.create(payload),
    onSuccess: refresh(c),
  });
}

export function useDeleteReview() {
  const c = useQueryClient();
  return useMutation({ mutationFn: reviewService.remove, onSuccess: refresh(c) });
}

export function useReplyReview() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      reviewService.reply(id, { reply }),
    onSuccess: refresh(c),
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
