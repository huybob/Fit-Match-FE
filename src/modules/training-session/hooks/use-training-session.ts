"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateSessionRequest, FeedbackRequest, trainingSessionService, UpdateSessionRequest } from "@/services/training-session.service";
import { trainingSessionKeys } from "../query-keys";

const refresh = (client: ReturnType<typeof useQueryClient>) => () => client.invalidateQueries({ queryKey: trainingSessionKeys.all });
export function useTrainingSessions(scope: "customer" | "pt", page = 0) {
  return useQuery({ queryKey: trainingSessionKeys.list(scope, page), queryFn: () => scope === "customer" ? trainingSessionService.getMine({ page, size: 10 }) : trainingSessionService.getPt({ page, size: 10 }) });
}
export function useTrainingSessionDetail(id: number) {
  return useQuery({ queryKey: trainingSessionKeys.detail(id), queryFn: () => trainingSessionService.getDetail(id), enabled: id > 0 });
}
export function useCreateTrainingSession() {
  const c = useQueryClient();
  return useMutation({ mutationFn: (payload: CreateSessionRequest) => trainingSessionService.create(payload), onSuccess: refresh(c) });
}
export function useUpdateTrainingSession() {
  const c = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateSessionRequest }) => trainingSessionService.update(id, payload), onSuccess: refresh(c) });
}
export function useSubmitSessionFeedback() {
  const c = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: FeedbackRequest }) => trainingSessionService.feedback(id, payload), onSuccess: refresh(c) });
}
